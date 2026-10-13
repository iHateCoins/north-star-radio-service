from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1500,'height':900})
    errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
    for host in ['https://cdnjs.cloudflare.com/**','https://fonts.googleapis.com/**','https://fonts.gstatic.com/**']:
        page.route(host,lambda route:route.abort())
    page.set_content(html,wait_until='domcontentloaded',timeout=40000)
    page.evaluate('S.bench=S.jobs[0].id;R.view="ledger";renderBench();closeModal()')
    assert page.locator('.build-watermark').inner_text().startswith('BUILD v0.17.0')
    assert page.locator('meta[name="nsrs-build"]').get_attribute('content')=='v0.17.0'
    assert page.locator('.sl-bench-ref tbody tr').count()==6
    assert 'Factory measurement & device audit: PASS' in page.locator('.source-ledger').inner_text()
    assert 'FACTORY TRANSCRIPTION INCOMPLETE' in page.locator('.source-ledger').inner_text()
    page.locator('[data-stage="DETECTOR"]').click()
    assert page.locator('.sl-bench-ref tbody tr').count()==1
    assert 'V3:5' in page.locator('.source-ledger').inner_text()
    assert 'V3:6' in page.locator('.source-ledger').inner_text()
    page.locator('[data-stage="IF"]').click()
    assert page.locator('.sl-bench-ref tbody tr').count()==2
    page.locator('[data-stage="RF"]').click()
    assert page.locator('.sl-bench-ref tbody tr').count()==2
    page.locator('[data-stage="POWER"]').click()
    assert '115 V AC/DC' in page.locator('.source-ledger').inner_text()
    healthy=page.evaluate('()=>{const job=benchJob();job.radio=newRadio();R.power=false;R.offV=null;runCheckout();return job.lastCheck?.pass;}')
    assert healthy
    assert not errors,errors
    print('PASS v0.17 browser stages, meter fixture and healthy checkout')
    browser.close()
