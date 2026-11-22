#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT/linux/scripts/shared/htpc-audio"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/bin" "$TMP/runtime"
export MOCK_PROFILE_FILE="$TMP/profile" MOCK_MODULE_FILE="$TMP/module" MOCK_INPUT_FILE="$TMP/input"
export XDG_RUNTIME_DIR="$TMP/runtime" PATH="$TMP/bin:$PATH" HTPC_AUDIO_PACTL_TIMEOUT=1
cat > "$TMP/bin/pactl" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
cmd="${1:-}"; shift || true
profile="$(cat "$MOCK_PROFILE_FILE")"
sink_for_profile() {
  case "$1" in
    output:hdmi-stereo) echo alsa_output.pci-0000_00_1f.3.hdmi-stereo ;;
    output:hdmi-surround) echo alsa_output.pci-0000_00_1f.3.hdmi-surround ;;
    output:hdmi-surround71) echo alsa_output.pci-0000_00_1f.3.hdmi-surround71 ;;
    output:analog-stereo) echo alsa_output.pci-0000_00_1f.3.analog-stereo ;;
  esac
}
sink_index() {
  case "$1" in
    alsa_output.pci-0000_00_1f.3.hdmi-stereo) echo 42 ;;
    alsa_output.pci-0000_00_1f.3.hdmi-surround) echo 43 ;;
    alsa_output.pci-0000_00_1f.3.hdmi-surround71) echo 44 ;;
    alsa_output.pci-0000_00_1f.3.analog-stereo) echo 45 ;;
    htpc_audio_transition_*) echo 90 ;;
    *) return 1 ;;
  esac
}
case "$cmd" in
  list)
    case "${1:-}" in
      cards) printf 'Card #0\n Name: alsa_card.pci-0000_00_1f.3\n Active Profile: %s\n' "$profile" ;;
      short)
        case "${2:-}" in
          sinks)
            sink="$(sink_for_profile "$profile")"
            printf '%s\t%s\tdriver\t48000 Hz\n' "$(sink_index "$sink")" "$sink"
            if [[ -s "$MOCK_MODULE_FILE" ]]; then
              module_sink="$(cat "$MOCK_MODULE_FILE")"
              printf '90\t%s\tdriver\t48000 Hz\n' "$module_sink"
            fi
            ;;
          sink-inputs)
            [[ "${MOCK_HANG_SINK_INPUT:-0}" != 1 ]] || sleep 30
            input_sink="$(cat "$MOCK_INPUT_FILE")"
            [[ -z "$input_sink" ]] || printf '100\t%s\tprotocol-native.c\tfloat32le 2ch 48000Hz\n' "$(sink_index "$input_sink")"
            ;;
        esac
        ;;
    esac
    ;;
  load-module)
    for arg in "$@"; do case "$arg" in sink_name=*) printf '%s' "${arg#sink_name=}" > "$MOCK_MODULE_FILE" ;; esac; done
    echo 77
    ;;
  unload-module)
    [[ "${MOCK_HANG_UNLOAD:-0}" != 1 ]] || sleep 30
    rm -f "$MOCK_MODULE_FILE"
    ;;
  move-sink-input)
    [[ "${MOCK_FAIL_MOVE_TO_TRANSITION:-0}" != 1 || "$2" != htpc_audio_transition_* ]] || exit 1
    [[ "$1" == 100 ]] || exit 1
    printf '%s' "$2" > "$MOCK_INPUT_FILE"
    ;;
  set-card-profile)
    [[ "${MOCK_FAIL_PROFILE:-0}" != 1 ]] || exit 1
    printf '%s' "$2" > "$MOCK_PROFILE_FILE"
    ;;
  *) echo "unexpected pactl command: $cmd $*" >&2; exit 2 ;;
esac
MOCK
chmod +x "$TMP/bin/pactl"
reset_state() {
  printf '%s' "$1" > "$MOCK_PROFILE_FILE"
  printf '%s' "$2" > "$MOCK_INPUT_FILE"
  : > "$MOCK_MODULE_FILE"
}
assert_eq() {
  [[ "$1" == "$2" ]] || { echo "FAIL: $3 (expected '$1', got '$2')" >&2; exit 1; }
}
run_audio() { bash "$SCRIPT" "$1"; }

reset_state output:hdmi-surround71 alsa_output.pci-0000_00_1f.3.hdmi-surround71
run_audio hdmi-stereo
assert_eq output:hdmi-stereo "$(cat "$MOCK_PROFILE_FILE")" "profile changes"
assert_eq alsa_output.pci-0000_00_1f.3.hdmi-stereo "$(cat "$MOCK_INPUT_FILE")" "stream reattached"
assert_eq "" "$(cat "$MOCK_MODULE_FILE")" "transition module cleaned up"

reset_state output:hdmi-surround71 alsa_output.pci-0000_00_1f.3.hdmi-surround71
MOCK_HANG_UNLOAD=1 run_audio hdmi-stereo
assert_eq output:hdmi-stereo "$(cat "$MOCK_PROFILE_FILE")" "profile changes despite hung cleanup"
reset_state output:hdmi-stereo alsa_output.pci-0000_00_1f.3.hdmi-stereo
run_audio surround51-hdmi
assert_eq output:hdmi-surround "$(cat "$MOCK_PROFILE_FILE")" "lock released after hung cleanup"

reset_state output:hdmi-surround71 alsa_output.pci-0000_00_1f.3.hdmi-surround71
if MOCK_HANG_SINK_INPUT=1 run_audio hdmi-stereo; then
  echo "FAIL: hung sink-input query unexpectedly succeeded" >&2; exit 1
fi
assert_eq output:hdmi-surround71 "$(cat "$MOCK_PROFILE_FILE")" "query timeout leaves old profile"
run_audio hdmi-stereo
assert_eq output:hdmi-stereo "$(cat "$MOCK_PROFILE_FILE")" "lock released after query timeout"

reset_state output:hdmi-surround71 alsa_output.pci-0000_00_1f.3.hdmi-surround71
if MOCK_FAIL_MOVE_TO_TRANSITION=1 run_audio hdmi-stereo; then
  echo "FAIL: failed stream parking unexpectedly succeeded" >&2; exit 1
fi
assert_eq output:hdmi-surround71 "$(cat "$MOCK_PROFILE_FILE")" "failed parking preserves profile"

reset_state output:hdmi-surround71 alsa_output.pci-0000_00_1f.3.hdmi-surround71
if MOCK_FAIL_PROFILE=1 run_audio hdmi-stereo; then
  echo "FAIL: failed profile command unexpectedly succeeded" >&2; exit 1
fi
assert_eq output:hdmi-surround71 "$(cat "$MOCK_PROFILE_FILE")" "profile failure preserves profile"
assert_eq alsa_output.pci-0000_00_1f.3.hdmi-surround71 "$(cat "$MOCK_INPUT_FILE")" "profile failure restores stream"

reset_state output:hdmi-surround71 ""
run_audio hdmi-stereo
assert_eq output:hdmi-stereo "$(cat "$MOCK_PROFILE_FILE")" "transition without active stream"
echo "htpc-audio adversarial tests passed"
