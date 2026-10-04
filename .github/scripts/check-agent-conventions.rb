#!/usr/bin/env ruby

# This repository is a Next.js app, so CI cannot install a Python package from
# the checkout. Read the tracked workflow contract and apply the same template
# expansion rules as Thrifty's compiler without an external dependency.
require "yaml"

ROOT = File.expand_path("../..", __dir__)
contract_path = ENV.fetch("THRIFTY_PROJECT_FILE", File.join(ROOT, "thrifty.project.yml"))
contract = YAML.load_file(contract_path)
workflow = contract.fetch("workflow")
ticket = workflow.fetch("ticket")
pull_request = workflow.fetch("pull_request")

fail = lambda do |message|
  warn "::error::#{message}"
  exit 1
end

branch = ENV.fetch("THRIFTY_BRANCH", "")
title = ENV.fetch("THRIFTY_PR_TITLE", "")
base_branch = ENV.fetch("THRIFTY_BASE_BRANCH", "")
fail.call("THRIFTY_BRANCH is required") if branch.empty?
fail.call("THRIFTY_PR_TITLE is required") if title.empty?
fail.call("THRIFTY_BASE_BRANCH is required") if base_branch.empty?

default_branch = workflow.fetch("default_branch")
target_branch = pull_request.fetch("target_branch")
fail.call("PR target branch must be #{target_branch} (got: #{base_branch})") unless base_branch == target_branch

keys = [ticket.fetch("key"), *ticket.fetch("legacy_keys", [])]
patterns = {
  "agent" => "(?:#{workflow.fetch("agents").map { |value| Regexp.escape(value) }.join("|")})",
  "type" => "(?:#{workflow.fetch("commit").fetch("types").map { |value| Regexp.escape(value) }.join("|")})",
  "ticket_lower" => "(?:#{keys.map(&:downcase).map { |value| Regexp.escape(value) }.join("|")})",
  "ticket_upper" => "(?:#{keys.map(&:upcase).map { |value| Regexp.escape(value) }.join("|")})",
  "number" => "\\d+",
  "slug" => "[a-z0-9]+(?:-[a-z0-9]+)*",
  "description" => ".+",
  "title" => ".+",
}

template_regex = lambda do |template, overrides = {}|
  fragments = []
  cursor = 0
  template.to_enum(:scan, /\{([a-z_]+)\}/).each do
    match = Regexp.last_match
    fragments << Regexp.escape(template[cursor...match.begin(0)])
    fragments << if overrides.key?(match[1])
      overrides.fetch(match[1])
    else
      patterns.fetch(match[1])
    end
    cursor = match.end(0)
  end
  fragments << Regexp.escape(template[cursor..])
  Regexp.new("\\A#{fragments.join}\\z")
end

branch_ticket = template_regex.call(workflow.fetch("branch").fetch("ticket"))
branch_misc = template_regex.call(workflow.fetch("branch").fetch("misc"))
native_branch = template_regex.call(
  workflow.fetch("branch").fetch("ticket"),
  "agent" => Regexp.escape("thrifty"),
  "slug" => "[0-9a-f]{16}",
)

branch_candidate = branch.strip
branch_ok = branch_candidate == default_branch ||
  branch_candidate == "chore/thrifty-maintenance" ||
  branch_ticket.match?(branch_candidate) ||
  branch_misc.match?(branch_candidate) ||
  native_branch.match?(branch_candidate)
fail.call("branch does not match the workflow contract: #{branch}") unless branch_ok

pr_ticket = template_regex.call(pull_request.fetch("ticket_title"))
pr_misc = template_regex.call(pull_request.fetch("misc_title"))
reserved_pr = /\Achore\(THRIFTY\): \S.*\z/
title_candidate = title.strip
title_ok = reserved_pr.match?(title_candidate) ||
  pr_ticket.match?(title_candidate) ||
  pr_misc.match?(title_candidate)
fail.call("PR title does not match the workflow contract: #{title}") unless title_ok

puts "Branch, PR title, and target branch match thrifty.project.yml."
