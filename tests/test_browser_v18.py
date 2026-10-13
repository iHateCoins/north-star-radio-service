from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1500,'height':900})
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    for host in ['https://cdnjs.cloudflare.com/**','https://fonts.googleapis.com/**','https://fonts.gstatic.com/**']:
        page.route(host,lambda route:route.abort())
    page.set_content((root/'index.html').read_text(),wait_until='domcontentloaded',timeout=40000)
    page.evaluate('S.bench=S.jobs[0].id;R.view="ledger";renderBench();closeModal()')
    # First-run manual can reopen as the tutorial advances; disable mouse interception for this UI regression only.
    page.add_style_tag(content='#modal{pointer-events:none!important} #modal *{pointer-events:none!important}')
    assert page.locator('.build-watermark').inner_text().startswith('BUILD v0.18.0')
    assert page.locator('meta[name="nsrs-build"]').get_attribute('content')=='v0.18.0'
    assert 'CONTINUITY AUDIT PASS' in page.locator('.source-ledger').inner_text()
    assert '14/14 source-limited cases' in page.locator('.source-ledger').inner_text()
    assert page.locator('.sl-continuity tbody tr').count()==14
    assert page.locator('.sl-bench-ref tbody tr').count()==6
    assert page.locator('table.sl-table').first.locator('tbody tr').count()==33
    for stage,rows in [('IF',3),('DETECTOR',2),('POWER',8),('ALL',14)]:
        page.locator('[data-stage="'+stage+'"]').click()
        assert page.locator('.sl-continuity tbody tr').count()==rows
    healthy=page.evaluate('()=>{const job=benchJob();job.radio=newRadio();R.power=false;R.offV=null;runCheckout();return job.lastCheck?.pass;}')
    assert healthy
    assert not errors,errors
    print('PASS v0.18 browser smoke, factory stage filters and healthy checkout')
    browser.close()
