#!/usr/bin/env node
/**
 * FerryAI MCP server (stdio). Users run it with npx, we host nothing.
 *
 *   FERRYAI_API_KEY=sk-... npx -y ferryai-mcp
 *
 * Tools: generate_image, generate_video, get_video_task, account_balance.
 * Every generation bills the API key's account balance.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const BASE = (process.env.FERRYAI_BASE_URL || 'https://ferryai.furrecast.com').replace(/\/+$/, '')
const KEY = process.env.FERRYAI_API_KEY || ''

async function api(method, path, body) {
  if (!KEY) throw new Error('FERRYAI_API_KEY is not set')
  const response = await fetch(BASE + path, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
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
    throw new Error(`${code || response.status}: ${message}${suffix}`)
  }
  return data
}

const text = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] })

const server = new McpServer({ name: 'ferryai', version: '0.1.3' })

server.tool(
  'generate_image',
  'Generate an image with nano-banana-2. Supports reference images.',
  {
    prompt: z.string().describe('What to draw'),
    model: z.string().optional().describe('Model id, default nano-banana-2'),
    aspect_ratio: z.string().optional().describe('1:1, 16:9, 9:16, 4:3 or 3:4'),
    references: z.array(z.string()).optional().describe('Reference image URLs (max 4)'),
    dry_run: z.boolean().optional().describe('Return the price without generating'),
  },
  async ({ prompt, model, aspect_ratio, references, dry_run }) => {
    const body = { prompt, model: model || 'nano-banana-2' }
    if (aspect_ratio) body.aspect_ratio = aspect_ratio
    if (references?.length) body.image_input = references
    if (dry_run) body.dry_run = true
    return text(await api('POST', '/v1/images', body))
  }
)

server.tool(
  'generate_video',
  'Submit a veo-3.1 video job. Returns a task id; poll with get_video_task.',
  {
    prompt: z.string().describe('What happens in the video'),
    model: z.string().optional().describe('Model id, default veo-3.1'),
    seconds: z.number().optional().describe('4, 6 or 8 seconds, default 4'),
    aspect_ratio: z.string().optional().describe('16:9 or 9:16'),
    images: z
      .array(z.string())
      .optional()
      .describe('1 image = first frame, 2 = first and last, 3 = reference mode (8s only)'),
  },
  async ({ prompt, model, seconds, aspect_ratio, images }) => {
    const body = { prompt, model: model || 'veo-3.1', seconds: seconds || 4 }
    if (aspect_ratio) body.aspect_ratio = aspect_ratio
    if (images?.length) body.image_urls = images
    return text(await api('POST', '/v1/videos', body))
  }
)

server.tool(
  'get_video_task',
  'Check a video job: IN_QUEUE, IN_PROGRESS, COMPLETED (with url) or FAILED.',
  { task_id: z.string().describe('Task id returned by generate_video') },
  async ({ task_id }) => text(await api('GET', `/v1/videos/${encodeURIComponent(task_id)}`))
)

server.tool('account_balance', 'Current balance and rate limit for this API key.', {}, async () =>
  text(await api('GET', '/v1/me'))
)

await server.connect(new StdioServerTransport())
