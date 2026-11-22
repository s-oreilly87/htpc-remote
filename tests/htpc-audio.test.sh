#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "\${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT/linux/scripts/shared/htpc-audio"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/bin" "$TMP/runtime"
export MOCK_PROFILE_FILE="$TMP/profile" MOCK_MODULE_FILE="$TMP/module"
export MOCK_INPUT_FILE="$TMP/input" MOCK_LEGACY_SINK_FILE="$TMP/legacy"
export MOCK_LOG_FILE="$TMP/log" XDG_RUNTIME_DIR="$TMP/runtime"
export PATH="$TMP/bin:$PATH" HTPC_AUDIO_PACTL_TIMEOUT=1 HTPC_AUDIO_READY_TIMEOUT=2

cat > "$TMP/bin/pactl" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
cmd="\${1:-}"; shift || true
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
    htpc_audio_transition) echo 90 ;;
    htpc_audio_transition_*) echo 91 ;;
    *) return 1 ;;
  esac
}
printf '%s\n' "$cmd $*" >> "$MOCK_LOG_FILE"
case "$cmd" in
  list)
    case "\${1:-}" in
      cards) printf 'Card #0\n Name: alsa_card.pci-0000_00_1f.3\n Active Profile: %s\n' "$profile" ;;
      short)
        case "\${2:-}" in
          sinks)
            sink="$(sink_for_profile "$profile")"
            printf '%s\t%s\tdriver\t48000 Hz\n' "$(sink_index "$sink")" "$sink"
            [[ ! -s "$MOCK_MODULE_FILE" ]] || printf '90\thtpc_audio_transition\tdriver\t48000 Hz\n'
            if [[ -s "$MOCK_LEGACY_SINK_FILE" ]]; then
              legacy_sink="$(cat "$MOCK_LEGACY_SINK_FILE")"
              printf '91\t%s\tdriver\t48000 Hz\n' "$legacy_sink"
            fi
            ;;
          sink-inputs)
            [[ "\${MOCK_HANG_SINK_INPUT:-0}" != 1 ]] || sleep 30
            while read -r id sink_name; do
              [[ -n "$id" ]] || continue
              printf '%s\t%s\tprotocol-native.c\tfloat32le 2ch 48000Hz\n' "$id" "$(sink_index "$sink_name")"
            done < "$MOCK_INPUT_FILE"
            ;;
        esac
        ;;
    esac
    ;;
  load-module)
    for arg in "$@"; do case "$arg" in sink_name=*) printf '%s' "\${arg#sink_name=}" > "$MOCK_MODULE_FILE" ;; esac; done
    echo 77
    ;;
  move-sink-input)
    [[ "\${MOCK_FAIL_MOVE:-0}" != 1 ]] || exit 1
    input_id="$1"; target="$2"
    tmp_file="$MOCK_INPUT_FILE.tmp"
    while read -r id sink_name; do
      [[ -n "$id" ]] || continue
      [[ "$id" != "$input_id" ]] || sink_name="$target"
      printf '%s %s\n' "$id" "$sink_name" >> "$tmp_file"
    done < "$MOCK_INPUT_FILE"
    mv "$tmp_file" "$MOCK_INPUT_FILE"
    ;;
  set-card-profile)
    [[ "\${MOCK_FAIL_PROFILE:-0}" != 1 ]] || exit 1
    [[ "\${MOCK_IGNORE_PROFILE:-0}" == 1 ]] || printf '%s' "$2" > "$MOCK_PROFILE_FILE"
    ;;
  *)
    echo "unexpected pactl command (unload should never be used): $cmd $*" >&2
    exit 2
    ;;
esac
MOCK
chmod +x "$TMP/bin/pactl"

reset_state() {
  printf '%s' "$1" > "$MOCK_PROFILE_FILE"
  printf '%s' "$2" > "$MOCK_INPUT_FILE"
  : > "$MOCK_MODULE_FILE"
  : > "$MOCK_LEGACY_SINK_FILE"
  : > "$MOCK_LOG_FILE"
}
assert_eq() {
  [[ "$1" == "$2" ]] || { echo "FAIL: $3 (expected '$1', got '$2')" >&2; exit 1; }
}
run_audio() { bash "$SCRIPT" "$1"; }

# First live switch creates the persistent sink, parks the stream, then reattaches it.
reset_state output:hdmi-surround71 "100 alsa_output.pci-0000_00_1f.3.hdmi-surround71"
run_audio hdmi-stereo
assert_eq output:hdmi-stereo "$(cat "$MOCK_PROFILE_FILE")" "profile changes"
assert_eq "100 alsa_output.pci-0000_00_1f.3.hdmi-stereo" "$(cat "$MOCK_INPUT_FILE")" "stream reattached"
assert_eq htpc_audio_transition "$(cat "$MOCK_MODULE_FILE")" "persistent sink created"
! grep -q '^unload-module' "$MOCK_LOG_FILE"

# Subsequent transitions reuse the persistent sink rather than loading/unloading modules.
reset_state output:hdmi-stereo "100 alsa_output.pci-0000_00_1f.3.hdmi-stereo"
printf htpc_audio_transition > "$MOCK_MODULE_FILE"
run_audio surround51-hdmi
assert_eq output:hdmi-surround "$(cat "$MOCK_PROFILE_FILE")" "second profile transition"
assert_eq "100 alsa_output.pci-0000_00_1f.3.hdmi-surround" "$(cat "$MOCK_INPUT_FILE")" "second stream reattachment"
[[ "$(grep -c '^load-module' "$MOCK_LOG_FILE" || true)" == 0 ]]
! grep -q '^unload-module' "$MOCK_LOG_FILE"

# Recover a stream stranded on a uniquely named sink left by the previous implementation.
reset_state output:hdmi-surround71 "100 htpc_audio_transition_12345"
printf htpc_audio_transition > "$MOCK_MODULE_FILE"
printf htpc_audio_transition_12345 > "$MOCK_LEGACY_SINK_FILE"
run_audio hdmi-stereo
assert_eq output:hdmi-stereo "$(cat "$MOCK_PROFILE_FILE")" "legacy transition recovery changes profile"
assert_eq "100 alsa_output.pci-0000_00_1f.3.hdmi-stereo" "$(cat "$MOCK_INPUT_FILE")" "legacy stream recovered"

# Same-profile selection recovers a stream stranded on the persistent sink without resetting the profile.
reset_state output:hdmi-stereo "100 htpc_audio_transition"
printf htpc_audio_transition > "$MOCK_MODULE_FILE"
run_audio hdmi-stereo
assert_eq output:hdmi-stereo "$(cat "$MOCK_PROFILE_FILE")" "same-profile recovery preserves profile"
assert_eq "100 alsa_output.pci-0000_00_1f.3.hdmi-stereo" "$(cat "$MOCK_INPUT_FILE")" "same-profile stream recovered"

# A hung sink-input query fails safely and does not hold the lock; the next call succeeds.
reset_state output:hdmi-surround71 "100 alsa_output.pci-0000_00_1f.3.hdmi-surround71"
if MOCK_HANG_SINK_INPUT=1 run_audio hdmi-stereo; then
  echo "FAIL: hung sink-input query unexpectedly succeeded" >&2; exit 1
fi
assert_eq output:hdmi-surround71 "$(cat "$MOCK_PROFILE_FILE")" "query timeout leaves profile unchanged"
run_audio hdmi-stereo
assert_eq output:hdmi-stereo "$(cat "$MOCK_PROFILE_FILE")" "lock released after query timeout"

# A failed stream move must not change the profile.
reset_state output:hdmi-surround71 "100 alsa_output.pci-0000_00_1f.3.hdmi-surround71"
if MOCK_FAIL_MOVE=1 run_audio hdmi-stereo; then
  echo "FAIL: failed stream move unexpectedly succeeded" >&2; exit 1
fi
assert_eq output:hdmi-surround71 "$(cat "$MOCK_PROFILE_FILE")" "failed parking preserves profile"

# Profile-setting failure must restore the old sink.
reset_state output:hdmi-surround71 "100 alsa_output.pci-0000_00_1f.3.hdmi-surround71"
printf htpc_audio_transition > "$MOCK_MODULE_FILE"
if MOCK_FAIL_PROFILE=1 run_audio hdmi-stereo; then
  echo "FAIL: failed profile command unexpectedly succeeded" >&2; exit 1
fi
assert_eq output:hdmi-surround71 "$(cat "$MOCK_PROFILE_FILE")" "profile failure preserves profile"
assert_eq "100 alsa_output.pci-0000_00_1f.3.hdmi-surround71" "$(cat "$MOCK_INPUT_FILE")" "profile failure restores stream"

# A successful profile command that never activates must time out and restore the previous profile.
reset_state output:hdmi-surround71 "100 alsa_output.pci-0000_00_1f.3.hdmi-surround71"
printf htpc_audio_transition > "$MOCK_MODULE_FILE"
if MOCK_IGNORE_PROFILE=1 run_audio hdmi-stereo; then
  echo "FAIL: stale profile unexpectedly succeeded" >&2; exit 1
fi
assert_eq output:hdmi-surround71 "$(cat "$MOCK_PROFILE_FILE")" "readiness timeout restores old profile"
assert_eq "100 alsa_output.pci-0000_00_1f.3.hdmi-surround71" "$(cat "$MOCK_INPUT_FILE")" "readiness timeout restores stream"

# No active streams: change profile without creating a transition sink.
reset_state output:hdmi-surround71 ""
run_audio hdmi-stereo
assert_eq output:hdmi-stereo "$(cat "$MOCK_PROFILE_FILE")" "transition without active stream"
assert_eq "" "$(cat "$MOCK_MODULE_FILE")" "no transition sink created without active stream"

echo "htpc-audio adversarial tests passed"
