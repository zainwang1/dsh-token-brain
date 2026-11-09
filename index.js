/**
 * Token Brain — Host half.
 *
 * Registers every `skills/*.md` file in this package as a runtime skill in the
 * Harness skill catalog. Each file carries a small YAML-ish frontmatter block
 * (name / description / whenToUse / license) followed by the markdown body that
 * the model receives when it invokes the skill.
 *
 * Keys must stay single-line so this parser stays dependency-free.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const skillsDir = join(here, 'skills')

/** @type {readonly string[]} */
export const inject = ['skills']

/**
 * Split `---` frontmatter from the markdown body. Returns `null` when the file
 * is not a usable skill.
 */
function parseSkillFile(raw) {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  if (!text.startsWith('---\n')) return null
  const end = text.indexOf('\n---\n', 4)
  if (end < 0) return null

  const data = {}
  for (const line of text.slice(4, end).split('\n')) {
    const match = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line.trim())
    if (!match) continue
    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1).trim()
    }
    if (value) data[match[1]] = value
  }

  const body = text.slice(end + 5).trim()
  if (!data.name || !data.description || !body) return null

  return { data, body }
}

function loadSkillFiles() {
  let entries
  try {
    entries = readdirSync(skillsDir)
  } catch (error) {
    console.warn('[token-brain] skills directory unavailable:', error?.message ?? error)
    return []
  }

  const skills = []

  for (const entry of entries.slice().sort()) {
    if (!entry.endsWith('.md')) continue
    try {
      const parsed = parseSkillFile(readFileSync(join(skillsDir, entry), 'utf8'))
      if (!parsed) {
        console.warn('[token-brain] skipping malformed skill file:', entry)
        continue
      }
      skills.push({
        name: parsed.data.name,
        description: parsed.data.description,
        whenToUse: parsed.data.whenToUse,
        url: parsed.data.url,
        license: parsed.data.license,
        content: parsed.body,
      })
    } catch (error) {
      console.warn('[token-brain] failed to read', entry, error?.message ?? error)
    }
  }
  return skills
}

export function apply(ctx, config = {}) {
  const disabled = new Set(Array.isArray(config?.disabled) ? config.disabled : [])
  const skills = loadSkillFiles()

  if (skills.length === 0) {
    console.warn('[token-brain] no skills found; nothing registered')
    return
  }

  let registered = 0
  for (const skill of skills) {
    if (disabled.has(skill.name)) continue
    registered += 1
    ctx.effect(() => {
      return ctx.skills.register({
        name: skill.name,
        description: skill.description,
        ...(skill.whenToUse ? { whenToUse: skill.whenToUse } : {}),
        content: skill.content,
        source: 'runtime',
        ...(skill.url ? { resourceBase: { kind: 'url', url: skill.url } } : {}),
        metadata: {
          pack: 'token-brain',
          license: skill.license,
        },
      })
    })
  }

  console.info(`[token-brain] registered ${registered} skills`)
}

