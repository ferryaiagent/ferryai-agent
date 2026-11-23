import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import http from 'node:http'
import test from 'node:test'

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

  const child = spawn(process.execPath, ['bin/ferryai.mjs', 'balance'], {
    env: {
      ...process.env,
      FERRYAI_API_KEY: 'sk-test',
      FERRYAI_BASE_URL: `http://127.0.0.1:${server.address().port}`,
    },
  })
  let stderr = ''
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (chunk) => {
    stderr += chunk
  })

  const code = await new Promise((resolve) => child.on('exit', resolve))

  assert.equal(code, 1)
  assert.match(stderr, /error 503: HTTP 503 \[request_id req-html\]/)
  assert.doesNotMatch(stderr, /bad gateway secret|<html>/)
})
