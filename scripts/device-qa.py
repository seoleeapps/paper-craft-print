"""Small ADB helper. Operates only the explicitly selected device and app."""
import argparse,subprocess,xml.etree.ElementTree as ET,re,time
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--serial',required=True);p.add_argument('action',choices=['capture','tap','text','back','swipe']);p.add_argument('value',nargs='?',default='');args=p.parse_args()
def adb(*xs,**kwargs):return subprocess.run(['adb','-s',args.serial,*xs],check=True,timeout=45,**kwargs)
def dump():
 result=adb('shell','uiautomator','dump','--compressed','/sdcard/paper-craft-ui.xml',capture_output=True)
 if b'ERROR' in result.stdout or b'ERROR' in result.stderr:raise RuntimeError('UI capture failed; refusing stale XML')
 return adb('exec-out','cat','/sdcard/paper-craft-ui.xml',capture_output=True).stdout
if args.action=='capture':
 xml=dump();root=Path('artifacts/device');root.mkdir(parents=True,exist_ok=True);(root/(args.value+'.xml')).write_bytes(xml);(root/(args.value+'.png')).write_bytes(adb('exec-out','screencap','-p',capture_output=True).stdout)
 print('\n'.join(f'{n.get("text") or n.get("content-desc")} {n.get("bounds")}'for n in ET.fromstring(xml).iter('node')if n.get('text')or n.get('content-desc')))
elif args.action=='tap':
 nodes=[]
 for attempt in range(5):
  nodes=[n for n in ET.fromstring(dump()).iter('node')if n.get('text')==args.value or n.get('content-desc')==args.value]
  nodes=[n for n in nodes if (lambda b: b[2]>b[0] and b[3]>b[1])(list(map(int,re.findall(r'\d+',n.get('bounds')))))]
  if nodes:break
  time.sleep(.5)
 if not nodes:raise SystemExit('Target not visible: '+args.value)
 x1,y1,x2,y2=map(int,re.findall(r'\d+',nodes[-1].get('bounds')));adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2))
elif args.action=='text':adb('shell','input','text',args.value.replace(' ','%s'))
elif args.action=='back':adb('shell','input','keyevent','4')
elif args.action=='swipe':adb('shell','input','swipe',*args.value.split(','))
