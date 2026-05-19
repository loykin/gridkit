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
const detachedServer = process.platform !== 'win32'

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
    ['--dir', 'playground', 'dev', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
    {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, BROWSER: 'none' },
      detached: detachedServer,
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
  if (!server || server.killed) return

  const killServer = (signal) => {
    if (detachedServer && server.pid) {
      try {
        process.kill(-server.pid, signal)
        return
      } catch {
        // Fall back to killing the direct child below.
      }
    }
    server.kill(signal)
  }

  killServer('SIGTERM')
  const exited = await Promise.race([
    once(server, 'exit').then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 1000)),
  ])
  if (!exited) killServer('SIGKILL')
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

  await page.waitForFunction(
    ({ selector, width }) => {
      const node = globalThis.document.querySelector(selector)
      return !!node && node.getBoundingClientRect().width < width - 20
    },
    { selector: '.dg-header [role="columnheader"][data-col-id="name"]', width: beforeBox.width },
    { timeout: 1000 },
  )
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

  const organization = page.getByRole('columnheader', { name: 'Organization' }).first()
  const department = page.getByRole('columnheader', { name: /Department/ }).first()
  const status = page.getByRole('columnheader', { name: /Status/ }).first()

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

test('header theme tokens style header cells and filter row', async () => {
  const page = await newPage()
  await openTab(page, 'Fill Container')

  await page.addStyleTag({
    content: `
      .dg-token-test {
        --dg-header-background: rgb(1 2 3);
        --dg-header-foreground: rgb(250 251 252);
        --dg-header-border: rgb(70 80 90);
        --dg-header-control-background: rgb(10 20 30);
        --dg-header-control-foreground: rgb(230 240 250);
        --dg-header-control-border: rgb(40 50 60);
        --dg-header-popover-background: rgb(4 5 6);
        --dg-header-popover-foreground: rgb(240 241 242);
        --dg-header-popover-border: rgb(90 91 92);
      }
    `,
  })
  await page.locator('[data-testid="fill-long-case"] .dg-shell').evaluate((node) => node.classList.add('dg-token-test'))
  await page.evaluate(() => {
    if (globalThis.document.activeElement instanceof globalThis.HTMLElement) {
      globalThis.document.activeElement.blur()
    }
  })

  const styles = await page.evaluate(() => {
    const header = globalThis.document.querySelector('.dg-token-test .dg-header')
    const leafCell = globalThis.document.querySelector('.dg-token-test .dg-header-cell[data-col-id="id"]')
    const groupCell = globalThis.document.querySelector('.dg-token-test .dg-header-cell[data-header-group="true"]')
    const filterRow = globalThis.document.querySelector('.dg-token-test .dg-filter-row')
    const input = Array.from(globalThis.document.querySelectorAll('.dg-token-test .dg-filter-row .dg-input'))
      .find((node) => node !== globalThis.document.activeElement)
    const select = globalThis.document.querySelector('.dg-token-test .dg-filter-row .dg-select')
    const read = (node) => {
      const style = getComputedStyle(node)
      return {
        background: style.backgroundColor,
        color: style.color,
        borderColor: style.borderColor,
        borderBottomColor: style.borderBottomColor,
        controlBorder: style.getPropertyValue('--dg-control-border').trim(),
        headerControlBorder: style.getPropertyValue('--dg-header-control-border').trim(),
      }
    }

    return {
      header: read(header),
      leafCell: read(leafCell),
      groupCell: read(groupCell),
      filterRow: read(filterRow),
      input: read(input),
      select: read(select),
    }
  })

  assert.equal(styles.header.background, 'rgb(1, 2, 3)')
  assert.equal(styles.leafCell.background, 'rgb(1, 2, 3)')
  assert.equal(styles.leafCell.color, 'rgb(250, 251, 252)')
  assert.equal(styles.filterRow.background, 'rgb(1, 2, 3)')
  assert.equal(styles.filterRow.borderBottomColor, 'rgb(70, 80, 90)')
  assert.equal(styles.groupCell.background, 'rgb(1, 2, 3)')
  assert.equal(styles.groupCell.color, 'rgb(250, 251, 252)')
  assert.equal(styles.input.background, 'rgb(10, 20, 30)')
  assert.equal(styles.input.color, 'rgb(230, 240, 250)')
  assert.equal(styles.input.headerControlBorder, 'rgb(40 50 60)')
  assert.equal(styles.select.background, 'rgb(10, 20, 30)')
  assert.equal(styles.select.color, 'rgb(230, 240, 250)')
  assert.equal(styles.select.headerControlBorder, 'rgb(40 50 60)')

  await page.getByRole('button', { name: 'Pin options for id' }).click()
  const popover = page.locator('.dg-header-popover').last()
  await popover.waitFor({ state: 'visible', timeout: 1000 })
  const popoverStyles = await popover.evaluate((node) => {
    const style = getComputedStyle(node)
    return {
      background: style.backgroundColor,
      color: style.color,
      borderColor: style.borderColor,
    }
  })

  assert.equal(popoverStyles.background, 'rgb(4, 5, 6)')
  assert.equal(popoverStyles.color, 'rgb(240, 241, 242)')
  assert.equal(popoverStyles.borderColor, 'rgb(90, 91, 92)')

  await closePage(page)
})

test('fillContainer preserves natural height until body overflow', async () => {
  const page = await newPage()
  await openTab(page, 'Fill Container')

  const readCase = async (testId) => page.locator(`[data-testid="${testId}"]`).evaluate((root) => {
    const shell = root.querySelector('.dg-shell')
    const tableWrapper = root.querySelector('.dg-table-wrapper')
    const body = root.querySelector('.dg-body-scroll')
    const footer = root.querySelector('.dg-footer')
    const rect = (node) => {
      const box = node.getBoundingClientRect()
      return { top: box.top, bottom: box.bottom, height: box.height }
    }

    return {
      shell: rect(shell),
      tableWrapper: rect(tableWrapper),
      body: { clientHeight: body.clientHeight, scrollHeight: body.scrollHeight },
      footer: footer ? rect(footer) : null,
    }
  })

  await page.waitForTimeout(300)
  const shortCase = await readCase('fill-short-case')
  const longCase = await readCase('fill-long-case')

  assert.ok(
    shortCase.body.scrollHeight <= shortCase.body.clientHeight + 1,
    `short data should not scroll: ${shortCase.body.scrollHeight} > ${shortCase.body.clientHeight}`,
  )
  assert.ok(shortCase.footer.top - shortCase.tableWrapper.bottom < 20)

  assert.ok(
    longCase.body.scrollHeight > longCase.body.clientHeight + 100,
    `long data should scroll: ${longCase.body.scrollHeight} <= ${longCase.body.clientHeight}`,
  )
  assert.ok(
    Math.abs(longCase.footer.bottom - longCase.shell.bottom) < 2,
    `footer should stay at shell bottom: ${longCase.footer.bottom} != ${longCase.shell.bottom}`,
  )

  await closePage(page)
})

test('fillParent fills parent height and virtualizes overflowing rows', async () => {
  const page = await newPage()
  await openTab(page, 'Fill Parent')

  const readCase = async (testId) => page.locator(`[data-testid="${testId}"]`).evaluate((root) => {
    const shell = root.querySelector('.dg-shell')
    const body = root.querySelector('.dg-body-scroll')
    const footer = root.querySelector('.dg-footer')
    const rows = root.querySelectorAll('.dg-row')
    const rect = (node) => {
      const box = node.getBoundingClientRect()
      return { top: box.top, bottom: box.bottom, height: box.height }
    }

    return {
      root: rect(root),
      shell: rect(shell),
      body: { clientHeight: body.clientHeight, scrollHeight: body.scrollHeight },
      footer: footer ? rect(footer) : null,
      marker: shell.getAttribute('data-fill-parent'),
      rowCount: rows.length,
    }
  })

  await page.waitForTimeout(300)
  const shortCase = await readCase('fill-parent-short-case')
  const longCase = await readCase('fill-parent-long-case')

  assert.equal(shortCase.marker, 'true')
  assert.ok(
    Math.abs(shortCase.footer.bottom - shortCase.shell.bottom) < 2,
    `short footer should stay at shell bottom: ${shortCase.footer.bottom} != ${shortCase.shell.bottom}`,
  )

  assert.equal(longCase.marker, 'true')
  assert.ok(
    longCase.body.scrollHeight > longCase.body.clientHeight + 100,
    `long data should scroll: ${longCase.body.scrollHeight} <= ${longCase.body.clientHeight}`,
  )
  assert.ok(
    Math.abs(longCase.footer.bottom - longCase.shell.bottom) < 2,
    `long footer should stay at shell bottom: ${longCase.footer.bottom} != ${longCase.shell.bottom}`,
  )
  assert.ok(longCase.rowCount < 500, `expected virtualized rows, got ${longCase.rowCount}`)

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
    await popover.waitFor({ state: 'visible', timeout: 1000 })
    assert.equal(await inputs.count(), 2)
    await inputs.nth(1).waitFor({ state: 'visible', timeout: 1000 })
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

test('column pinning marks pinned headers as pinned', async () => {
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
  assert.equal(position, 'absolute')
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
    assert.ok(await page.getByRole('menuitem', { name: 'Logs' }).isVisible())
    assert.ok(await page.getByRole('menuitem', { name: 'Delete' }).isVisible())
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
