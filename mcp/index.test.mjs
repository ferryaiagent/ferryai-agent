import assert from 'node:assert/strict'
import http from 'node:http'
import test from 'node:test'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

test('non-JSON failures keep status and request id without leaking HTML', async (t) => {
  const server = http.createServer((_request, response) => {
    response.writeHead(503, {
      'content-type': 'text/html',
      'x-request-id': 'req-html',
    })
    response.end('<html><body>bad gateway secret</body></html>')
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => server.close())

  const address = server.address()
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['index.mjs'],
    env: {
      ...process.env,
      FERRYAI_API_KEY: 'sk-test',
      FERRYAI_BASE_URL: `http://127.0.0.1:${address.port}`,
    },
  })
  const client = new Client({ name: 'ferryai-error-test', version: '1.0.0' })
  await client.connect(transport)
  t.after(() => client.close())

  const result = await client.callTool({
    name: 'account_balance',
    arguments: {},
  })
  const message = result.content?.[0]?.text ?? ''

  assert.equal(result.isError, true)
  assert.match(message, /503: HTTP 503 \[request_id req-html\]/)
  assert.doesNotMatch(message, /bad gateway secret|<html>/)
})
