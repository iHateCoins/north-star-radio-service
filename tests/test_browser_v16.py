from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 page=browser.new_page(viewport={'width':1440,'height':900})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for host in ['https://cdnjs.cloudflare.com/**','https://fonts.googleapis.com/**','https://fonts.gstatic.com/**']:
  page.route(host,lambda route:route.abort())
 page.set_content((root/'index.html').read_text(),wait_until='domcontentloaded')
 page.evaluate('S.bench=S.jobs[0].id;R.view="ledger";renderBench();closeModal()')
 assert page.locator('.build-watermark').count()==1
 assert 'BUILD v0.16.0' in page.locator('.build-watermark').inner_text()
 assert page.locator('.sl-table tbody tr').count()==33
 assert 'DEVICE-TOPOLOGY AND PILOT BRANCH AUDIT PASSED' in page.locator('.source-ledger').inner_text()
 page.locator('[data-stage="POWER"]').click()
 assert '40 Ω + 80 Ω' in page.locator('.source-ledger').inner_text()
 page.locator('[data-stage="IF"]').click()
 assert '12:pPlate' in page.locator('.source-ledger').inner_text()
 assert not errors,errors
 print('PASS v0.16 browser smoke')
 browser.close()
