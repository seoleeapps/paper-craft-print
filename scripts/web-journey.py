"""Actual RN Web journey; platform SDK results are explicitly development substitutes."""
from pathlib import Path
import json, re, time, base64

async def run(page, output, url='http://localhost:8087'):
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    results=[]
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    await page.set_viewport_size({'width':390,'height':844})
    await page.goto(url,wait_until='networkidle')
    legacy={'id':'legacy','name':'Legacy envelope','width':60,'height':90,'tab':10,'pattern':'waves','front':{'text':'Legacy'},'back':{'text':''},'updatedAt':1}
    await page.evaluate('''legacy=>{localStorage.setItem('paper-craft-print.dev.v1',JSON.stringify({projects:{legacy},rights:{legacy:['waves']},events:[],settings:{language:'en'}}));sessionStorage.setItem('paper-craft.qa.ads','available')}''',legacy)
    await page.reload(wait_until='networkidle')
    async def button(name,exact=True):
        item=page.get_by_label(name,exact=True) if name in ['Back','뒤로'] else page.get_by_role('button',name=name,exact=exact)
        await item.click()
    async def snap(name):
        await page.screenshot(path=str(output/f'{name}.png'))
    async def record(name):
        results.append({'id':name,'status':'pass'})
    await page.get_by_role('heading',name='Your little paper studio').wait_for()
    assert await page.get_by_test_id('ad-banner').count()==1
    await snap('home-en')
    for name in ['Envelope','Gift box','Folded card','Gift tag','Bookmark','Paper bag']:
        await button(re.compile('^'+name+' [0-9]'))
        await page.get_by_role('heading',name='Make it yours').wait_for()
        assert await page.get_by_test_id('ad-banner').count()==0
        await page.get_by_role('textbox',name='Front A short note').fill('Front '+name)
        # Select an asymmetric photo through the actual browser file chooser.
        photo_data=await page.evaluate("""()=>{const c=document.createElement('canvas');c.width=120;c.height=180;const x=c.getContext('2d');x.fillStyle='#ce5848';x.fillRect(0,0,120,90);x.fillStyle='#246a9c';x.fillRect(0,90,120,90);x.fillStyle='white';x.font='24px sans-serif';x.fillText('TOP',30,35);return c.toDataURL('image/jpeg').split(',')[1]}""")
        photo=output/'photo.jpg';photo.write_bytes(base64.b64decode(photo_data))
        async with page.expect_file_chooser() as chooser:
            await button('Choose photo')
        await (await chooser.value).set_files(str(photo))
        await page.get_by_role('button',name='Remove photo',exact=True).wait_for()
        await page.get_by_role('button',name='Zoom increase',exact=True).click()
        await snap(name.lower().replace(' ','-')+'-editor')
        # The face button and navigation are both named Back; select its visible label.
        await page.get_by_role('button',name='Back',exact=True).last.click()
        await page.get_by_role('textbox',name='Back A short note').fill('작은 선물')
        await button('Check print layout')
        await page.get_by_role('heading',name='Check print layout').wait_for()
        assert await page.get_by_test_id('ad-banner').count()==0
        await button('Repeat to fill page',exact=False)
        await button('Letter',exact=False)
        await snap(name.lower().replace(' ','-')+'-layout')
        await button('Create PDF')
        await page.get_by_role('heading',name='Your PDF is ready').wait_for(timeout=30000)
        assert await page.get_by_test_id('ad-banner').count()==0
        async with page.expect_download() as download:
            await button('Save to a folder')
        await (await download.value).save_as(str(output/(name.replace(' ','-')+'.pdf')))
        await button('Back')
        await button('Back')
        await button('Back')
        await record('template-'+name)
    await button('My drafts')
    await page.get_by_text('Legacy envelope',exact=True).click()
    await page.get_by_role('textbox',name='Front A short note').wait_for()
    assert await page.get_by_role('textbox',name='Front A short note').input_value()=='Legacy'
    assert await page.get_by_role('button',name=re.compile('Waves.*Free')).count()==1
    await record('legacy-and-reward-restored')
    # Consent denial must not block output, no fill must not grant a reward.
    await page.evaluate("sessionStorage.setItem('paper-craft.qa.ads','no-fill')")
    page.once('dialog',lambda d:d.accept())
    await button(re.compile('Stars.*Ad unlock'))
    await page.get_by_text('Ad unavailable. You can continue with free patterns.',exact=True).wait_for()
    await button('Check print layout')
    await button('Create PDF')
    await page.get_by_role('heading',name='Your PDF is ready').wait_for(timeout=30000)
    await record('ad-failure-free-output')
    await button('Back');await button('Back');await button('Back')
    await page.evaluate("sessionStorage.setItem('paper-craft.qa.ads','available')")
    await button('My drafts')
    await page.get_by_text('Legacy envelope',exact=True).click()
    page.once('dialog',lambda d:d.accept())
    await button(re.compile('Stars.*Ad unlock'))
    await page.get_by_role('button',name=re.compile('Stars.*Free')).wait_for()
    await button('Back');await button('My drafts')
    await page.get_by_text('Legacy envelope',exact=True).locator('..').locator('..').get_by_role('button',name='Duplicate',exact=True).click()
    assert await page.get_by_text('Legacy envelope',exact=True).count()==2
    page.once('dialog',lambda d:d.accept())
    await page.get_by_text('Legacy envelope',exact=True).last.locator('..').locator('..').get_by_role('button',name='Delete',exact=True).click()
    assert await page.get_by_text('Legacy envelope',exact=True).count()==1
    await page.reload(wait_until='networkidle')
    await button('My drafts');await page.get_by_text('Legacy envelope',exact=True).click()
    assert await page.get_by_role('button',name=re.compile('Stars.*Free')).count()==1
    await record('reward-duplicate-delete-restart')
    await page.get_by_role('textbox',name='Width mm').fill('999')
    assert await page.get_by_role('button',name='Check print layout',exact=True).is_disabled()
    await page.get_by_role('textbox',name='Width mm').fill('60')
    assert await page.get_by_role('button',name='Check print layout',exact=True).is_enabled()
    await record('invalid-size-recovery')
    await button('Back');await button('Settings')
    page.once('dialog',lambda d:d.dismiss())
    await button('Ad privacy choices')
    await button('Back')
    assert await page.get_by_test_id('ad-banner').count()==0
    await record('consent-change-removes-banner')
    await button('Settings');await button('한국어',exact=False);await button('뒤로')
    await page.get_by_role('heading',name='나만의 작은 종이 작업실').wait_for()
    await page.set_viewport_size({'width':320,'height':568})
    # RN Web fonts are numeric pixels; increase text at the runtime boundary for large-text QA.
    await page.add_style_tag(content='[dir="auto"] {font-size:150% !important; line-height:1.5 !important;}')
    await snap('home-ko-small-large-text')
    await button(re.compile('^책갈피 [0-9]'))
    await page.get_by_role('textbox',name='앞면 짧은 문구').fill('작은 선물')
    await page.get_by_role('textbox',name='앞면 짧은 문구').scroll_into_view_if_needed()
    await snap('editor-ko-small-large-text')
    await button('출력 배치 확인');await button('PDF 만들기')
    await page.get_by_role('heading',name='PDF가 준비됐어요').wait_for(timeout=30000)
    await record('korean-small-large-text-output')
    assert not errors,errors
    report={'status':'pass','platform':'RN Web; native SDK and OS actions substituted','scenarios':results,'pageErrors':errors}
    (output/'journey.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    return report
