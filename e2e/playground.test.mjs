import { spawn } from 'node:child_process'
import { once } from 'node:events'
import test from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const PORT = 5177
const BASE_URL = `http://127.0.0.1:${PORT}`

let server
let browser
let serverOutput = ''

async function waitForServer(url, timeout = 20_000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Retry until Vite starts accepting connections.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

test.before(async () => {
  server = spawn(
    'pnpm',
    ['--dir', 'playground', 'dev', '--host', '127.0.0.1', '--port', String(PORT)],
    {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, BROWSER: 'none' },
    },
  )

  server.stdout.on('data', (chunk) => {
    serverOutput += String(chunk)
  })
  server.stderr.on('data', (chunk) => {
    serverOutput += String(chunk)
  })

  await waitForServer(BASE_URL).catch((error) => {
    throw new Error(`${error.message}\n\nServer output:\n${serverOutput}`)
  })
  browser = await chromium.launch()
})

test.after(async () => {
  await browser?.close()
  if (server && !server.killed) {
    server.kill('SIGTERM')
    await Promise.race([
      once(server, 'exit'),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ])
  }
})

async function newPage() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(BASE_URL)
  await page.evaluate(() => localStorage.clear())
  return page
}

async function closePage(page) {
  await page.close()
}

async function openTab(page, label) {
  await page.getByRole('button', { name: label }).click()
}

async function leafHeaderIds(page) {
  return page
    .locator('.dg-header .dg-header-row')
    .first()
    .locator('[role="columnheader"][data-col-id]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-col-id')))
}

test('column resize does not trigger column reorder', async () => {
  const page = await newPage()
  await openTab(page, 'State Persistence')
  await page.evaluate(() => localStorage.removeItem('gridkit:playground:persisted-state'))
  await page.reload()
  await openTab(page, 'State Persistence')

  const nameHeader = page.locator('.dg-header [role="columnheader"][data-col-id="name"]').first()
  const beforeBox = await nameHeader.boundingBox()
  assert.ok(beforeBox)

  const beforeOrder = await leafHeaderIds(page)
  const handle = nameHeader.locator('.dg-resize-handle')
  const handleBox = await handle.boundingBox()
  assert.ok(handleBox)

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(handleBox.x - 80, handleBox.y + handleBox.height / 2, { steps: 8 })
  await page.mouse.up()

  const afterBox = await nameHeader.boundingBox()
  assert.ok(afterBox)
  const afterOrder = await leafHeaderIds(page)

  assert.deepEqual(afterOrder, beforeOrder)
  assert.ok(afterBox.width < beforeBox.width - 20, `expected Name width to shrink from ${beforeBox.width}, got ${afterBox.width}`)
  await closePage(page)
})

test('header groups span their leaf header range', async () => {
  const page = await newPage()
  await openTab(page, 'Header Groups')

  const organization = page.getByRole('columnheader', { name: 'Organization' })
  const department = page.getByRole('columnheader', { name: /Department/ })
  const status = page.getByRole('columnheader', { name: /Status/ })

  const orgBox = await organization.boundingBox()
  const deptBox = await department.boundingBox()
  const statusBox = await status.boundingBox()
  assert.ok(orgBox)
  assert.ok(deptBox)
  assert.ok(statusBox)

  assert.ok(orgBox.x <= deptBox.x + 1, `Organization starts after Department: ${orgBox.x} > ${deptBox.x}`)
  assert.ok(
    orgBox.x + orgBox.width >= statusBox.x + statusBox.width - 1,
    `Organization does not cover Status: ${orgBox.x + orgBox.width} < ${statusBox.x + statusBox.width}`,
  )
  await closePage(page)
})

test('datetime range popover shows seconds inputs without clipping', async () => {
  const page = await newPage()
  await openTab(page, 'Log Stream')

  const timeHeader = page.locator('.dg-header [role="columnheader"][data-col-id="timestamp"]').first()
  await timeHeader.locator('button').click()

  const popover = page.locator('.dg-popover-content').last()
  const inputs = popover.locator('input[type="datetime-local"]')
  await assert.doesNotReject(async () => {
    assert.equal(await inputs.count(), 2)
  })

  const popoverBox = await popover.boundingBox()
  const secondInputBox = await inputs.nth(1).boundingBox()
  assert.ok(popoverBox)
  assert.ok(secondInputBox)
  assert.ok(
    secondInputBox.x + secondInputBox.width <= popoverBox.x + popoverBox.width + 1,
    'datetime input overflows the popover',
  )
  await closePage(page)
})

test('state persistence restores column sizing after reload', async () => {
  const page = await newPage()
  await page.evaluate(() => localStorage.removeItem('gridkit:playground:persisted-state'))
  await openTab(page, 'State Persistence')

  const nameHeader = page.locator('.dg-header [role="columnheader"][data-col-id="name"]').first()
  const beforeBox = await nameHeader.boundingBox()
  assert.ok(beforeBox)

  const handleBox = await nameHeader.locator('.dg-resize-handle').boundingBox()
  assert.ok(handleBox)
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(handleBox.x - 70, handleBox.y + handleBox.height / 2, { steps: 8 })
  await page.mouse.up()

  const resizedBox = await nameHeader.boundingBox()
  assert.ok(resizedBox)
  await page.waitForTimeout(500)
  await page.reload()
  await openTab(page, 'State Persistence')

  const restoredBox = await nameHeader.boundingBox()
  assert.ok(restoredBox)
  assert.ok(Math.abs(restoredBox.width - resizedBox.width) < 5)
  await closePage(page)
})

test('column visibility dropdown hides and restores a column', async () => {
  const page = await newPage()
  await openTab(page, 'State Persistence')
  await page.evaluate(() => localStorage.removeItem('gridkit:playground:persisted-state'))
  await page.reload()
  await openTab(page, 'State Persistence')

  const departmentHeader = page.locator('.dg-header [role="columnheader"][data-col-id="department"]').first()
  await assert.doesNotReject(async () => {
    assert.ok(await departmentHeader.isVisible())
  })

  await page.getByRole('button', { name: 'Choose visible columns' }).click()
  await page.getByRole('checkbox', { name: 'Toggle Department column visibility' }).click()
  await assert.doesNotReject(async () => {
    await departmentHeader.waitFor({ state: 'detached', timeout: 1000 })
  })

  await page.getByRole('checkbox', { name: 'Toggle Department column visibility' }).click()
  await assert.doesNotReject(async () => {
    await departmentHeader.waitFor({ state: 'visible', timeout: 1000 })
  })
  await closePage(page)
})

test('column pinning marks pinned headers as sticky', async () => {
  const page = await newPage()
  await openTab(page, 'Column Pinning UI')

  const nameHeader = page.locator('.dg-header [role="columnheader"][data-col-id="name"]').first()
  await nameHeader.getByRole('button', { name: 'Pin options for name' }).click()
  await page.getByRole('button', { name: 'Pin Left' }).click()

  await assert.doesNotReject(async () => {
    await nameHeader.waitFor({ state: 'visible' })
  })
  assert.equal(await nameHeader.getAttribute('data-pinned'), 'left')
  const position = await nameHeader.evaluate((node) => getComputedStyle(node).position)
  assert.equal(position, 'sticky')
  await closePage(page)
})

test('row actions menu opens and exposes action items', async () => {
  const page = await newPage()
  page.on('dialog', (dialog) => dialog.dismiss())
  await openTab(page, 'DataStore')

  const actionsButton = page.getByRole('button', { name: /Open row actions for row/ }).first()
  await actionsButton.click()

  const menu = page.locator('.dg-action-menu')
  await assert.doesNotReject(async () => {
    await menu.waitFor({ state: 'visible', timeout: 1000 })
  })
  await assert.doesNotReject(async () => {
    assert.ok(await page.getByRole('button', { name: 'Logs' }).isVisible())
    assert.ok(await page.getByRole('button', { name: 'Delete' }).isVisible())
  })
  await closePage(page)
})

test('row selection checkboxes update selection state', async () => {
  const page = await newPage()
  await openTab(page, 'Row Selection')

  await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).click()
  await assert.doesNotReject(async () => {
    await page.getByText('checkboxConfig · 1 row(s) selected').waitFor({ state: 'visible', timeout: 1000 })
  })

  await page.getByRole('checkbox', { name: 'Select all rows' }).click()
  await assert.doesNotReject(async () => {
    await page.getByText('checkboxConfig · 20 row(s) selected').waitFor({ state: 'visible', timeout: 1000 })
  })
  await closePage(page)
})

test('inline edit commits a changed cell value', async () => {
  const page = await newPage()
  await openTab(page, 'Inline Edit')

  const nameCell = page.locator('.dg-row [role="gridcell"][data-col-id="name"]').first()
  await nameCell.dblclick()
  const editor = nameCell.locator('input')
  await editor.fill('Edited Employee')
  await editor.press('Enter')

  await assert.doesNotReject(async () => {
    await page.getByRole('gridcell', { name: 'Edited Employee' }).waitFor({ state: 'visible', timeout: 1000 })
    await page.getByText('[1] name → "Edited Employee"').waitFor({ state: 'visible', timeout: 1000 })
  })
  await closePage(page)
})

test('tree rows expand nested children', async () => {
  const page = await newPage()
  await openTab(page, 'Tree / Groups')

  await page.getByRole('button', { name: 'Expand row' }).first().click()
  await assert.doesNotReject(async () => {
    await page.getByText('Kubernetes').waitFor({ state: 'visible', timeout: 1000 })
  })

  await page.locator('.dg-row').filter({ hasText: 'Kubernetes' }).getByRole('button', { name: 'Expand row' }).click()
  await assert.doesNotReject(async () => {
    await page.getByText('Node Exporter').waitFor({ state: 'visible', timeout: 1000 })
  })
  await closePage(page)
})

test('master-detail rows expand and collapse detail panels', async () => {
  const page = await newPage()
  await openTab(page, 'Master-Detail')

  const expand = page.getByRole('button', { name: 'Expand detail row' }).first()
  await expand.click()
  await assert.doesNotReject(async () => {
    await page.getByText('EMP-0001').waitFor({ state: 'visible', timeout: 1000 })
  })

  await page.getByRole('button', { name: 'Collapse detail row' }).first().click()
  await assert.doesNotReject(async () => {
    await page.getByText('EMP-0001').waitFor({ state: 'hidden', timeout: 1000 })
  })
  await closePage(page)
})
