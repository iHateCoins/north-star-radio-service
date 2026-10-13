from playwright.sync_api import sync_playwright
from pathlib import Path
import json
p=Path(__file__).parent/'North_Star_Radio_Service_v0_14_PT44.html'
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':900})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    for s in ['https://cdnjs.cloudflare.com/**','https://fonts.googleapis.com/**','https://fonts.gstatic.com/**']:
        page.route(s,lambda route:route.abort())
    page.set_content(p.read_text(),wait_until='domcontentloaded',timeout=30000)
    page.evaluate('S.bench=S.jobs[0].id;R.view="ledger";renderBench()')
    page.wait_for_timeout(550)
    page.evaluate('closeModal()')
    page.wait_for_timeout(80)
    assert page.locator('.source-ledger').count()==1
    assert page.locator('.sl-table tbody tr').count()==33
    assert page.locator('.sl-net-list .sl-net').count()==16
    assert 'FACTORY TRANSCRIPTION INCOMPLETE' in page.locator('.source-ledger').inner_text()
    page.locator('[data-stage="POWER"]').click()
    assert page.locator('.sl-table tbody tr').count()==6
    assert page.locator('.sl-net-list .sl-net').count()>0
    page.locator('[data-stage="DETECTOR"]').click()
    assert page.locator('.sl-table tbody tr').count()==5
    assert 'Still missing:' in page.locator('.source-ledger').inner_text()
    page.locator('[data-stage="ALL"]').click()
    page.screenshot(path=str(p.parent/'factory_ledger_v13.png'))
    old=page.evaluate('pt44FactorySubgraphAudit().ok')
    assert old
    page.evaluate('R.view="factorytopo";renderViews()')
    assert page.locator('[data-ledger-part]').count()==33
    # Verify shop gameplay and its simplified solver are still functional.
    test=page.evaluate('''() => {const job=benchJob();job.radio=newRadio();R.power=false;R.offV=null;runCheckout();return job.lastCheck?.pass}''')
    assert test,'regression: unmodified prototype radio must pass reduced-order checkout'
    assert not errors,errors
    print(json.dumps({'result':'PASS','rows':33,'factory_nets':16,'audit':old,'healthy_repair_checkout':test,'page_errors':errors},indent=2))
    browser.close()
