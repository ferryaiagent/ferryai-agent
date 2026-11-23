#!/usr/bin/env node
/**
 * FerryAI CLI — generate images and video from the terminal.
 *
 * Auth: FERRYAI_API_KEY (or --key). Keys are created in the console at
 * https://ferryai.furrecast.com/keys and bill your account balance.
 */
import { writeFile } from 'node:fs/promises'
import { basename } from 'node:path'

const BASE = (process.env.FERRYAI_BASE_URL || 'https://ferryai.furrecast.com').replace(/\/+$/, '')
const KEY = process.env.FERRYAI_API_KEY || ''

const HELP = `ferryai — image and video generation from the terminal

Usage
  ferryai image "<prompt>" [--model nano-banana-2] [--aspect 1:1]
                            [--ref <url>]... [--out file] [--dry-run]
  ferryai video "<prompt>" [--model veo-3.1] [--seconds 4|6|8] [--aspect 16:9]
                            [--image <url>]... [--wait] [--out file]
  ferryai task <task_id>
  ferryai balance
  ferryai models
  ferryai skill            print the agent skill (paste into Claude Code or Codex)

Options
  --key <sk-...>   API key (default: $FERRYAI_API_KEY)
  --json           machine readable output (default for task/balance/models)
  --out <path>     download the result to this file

Examples
  ferryai image "a red fox in deep snow" --out fox.png
  ferryai image "same style, night" --ref https://cdn.example/cat.png
  ferryai video "drone shot over a fjord" --seconds 4 --wait --out fjord.mp4
  ferryai balance
`

function parseArgs(argv) {
  const args = { _: [], refs: [], images: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--key') args.key = argv[++i]
    else if (arg === '--model') args.model = argv[++i]
    else if (arg === '--aspect') args.aspect = argv[++i]
    else if (arg === '--seconds') args.seconds = Number(argv[++i])
    else if (arg === '--out') args.out = argv[++i]
    else if (arg === '--ref') args.refs.push(argv[++i])
    else if (arg === '--image') args.images.push(argv[++i])
    else if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--wait') args.wait = true
    else if (arg === '--json') args.json = true
    else if (arg === '--help' || arg === '-h') args.help = true
    else args._.push(arg)
  }
  return args
}

function apiKey(args) {
  const key = args.key || KEY
  if (!key) {
    console.error('missing API key: set FERRYAI_API_KEY or pass --key sk-...')
    process.exit(2)
  }
  return key
}

async function call(args, method, path, body) {
  const response = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey(args)}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = null
  }
  if (!response.ok) {
    const error = data?.error
    const requestId = response.headers.get('x-request-id') || error?.request_id
    const code = error?.error_code || (typeof error?.code === 'string' ? error.code : '')
    const message = error?.message || data?.message || `HTTP ${response.status}`
    const suffix = requestId ? ` [request_id ${requestId}]` : ''
    console.error(`error ${code || response.status}: ${message}${suffix}`)
    process.exit(1)
  }
  return data
}

async function download(url, outPath) {
  const response = await fetch(url)
  if (!response.ok) {
    console.error(`download failed: http ${response.status}`)
    process.exit(1)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  const path = outPath || basename(new URL(url).pathname)
  await writeFile(path, buffer)
  return path
}

function print(data, asJson) {
  if (asJson) {
    console.log(JSON.stringify(data, null, 2))
    return
  }
  if (data.url) {
    console.log(data.url)
    return
  }
  console.log(JSON.stringify(data, null, 2))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const command = args._[0]

  if (!command || args.help) {
    console.log(HELP)
    return
  }

  if (command === 'skill') {
    const response = await fetch(BASE + '/skill.md')
    process.stdout.write(await response.text())
    return
  }

  if (command === 'models') {
    const response = await fetch(BASE + '/v1/models')
    print(await response.json(), true)
    return
  }

  if (command === 'balance') {
    print(await call(args, 'GET', '/v1/me'), true)
    return
  }

  if (command === 'task') {
    const id = args._[1]
    if (!id) {
      console.error('usage: ferryai task <task_id>')
      process.exit(2)
    }
    print(await call(args, 'GET', `/v1/videos/${id}`), true)
    return
  }

  if (command === 'image') {
    const prompt = args._.slice(1).join(' ')
    if (!prompt) {
      console.error('usage: ferryai image "<prompt>"')
      process.exit(2)
    }
    const body = { model: args.model || 'nano-banana-2', prompt }
    if (args.aspect) body.aspect_ratio = args.aspect
    if (args.refs.length) body.image_input = args.refs
    if (args.dryRun) body.dry_run = true
    const data = await call(args, 'POST', '/v1/images', body)
    if (args.out && data.url) {
      const saved = await download(data.url, args.out)
      console.log(saved)
      return
    }
    print(data, args.json)
    return
  }

  if (command === 'video') {
    const prompt = args._.slice(1).join(' ')
    if (!prompt) {
      console.error('usage: ferryai video "<prompt>"')
      process.exit(2)
    }
    const body = { model: args.model || 'veo-3.1', prompt, seconds: args.seconds || 4 }
    if (args.aspect) body.aspect_ratio = args.aspect
    if (args.images.length) body.image_urls = args.images
    const submitted = await call(args, 'POST', '/v1/videos', body)
    if (!args.wait) {
      print(submitted, true)
      return
    }
    let task = submitted
    for (let i = 0; i < 120; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      task = await call(args, 'GET', `/v1/videos/${submitted.task_id}`)
      if (task.status === 'COMPLETED') break
      if (task.status === 'FAILED') {
        console.error(JSON.stringify(task))
        process.exit(1)
      }
    }
    if (task.url && args.out) {
      console.log(await download(task.url, args.out))
    } else {
      print(task, true)
    }
    return
  }

  console.error(`unknown command: ${command}\n`)
  console.log(HELP)
  process.exit(2)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
