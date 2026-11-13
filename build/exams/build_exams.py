import json,glob,re
from dsl import split
TM={'set':'集合与常用逻辑','ineq':'不等式','func':'函数的概念与性质','explog':'指数函数与对数函数','trig':'三角函数与解三角形','seq':'数列','line':'直线与圆','conic':'圆锥曲线','vec':'平面向量','cplx':'复数','prob':'计数原理与概率','stat':'统计','deriv':'导数及其应用','solid':'立体几何',
'kin':'运动学','force':'力与牛顿运动定律','energy':'功和能·动量','circ':'曲线运动与万有引力','wave':'机械振动与机械波','estat':'静电场','dc':'恒定电流','mag':'磁场','emi':'电磁感应与交流电','heat':'热学','optics':'光学','modern':'近代物理',
'hz':'识解汉字','xc':'选词填空','bx':'辨析词语','bq':'补全语句','cd':'选词成段','yd':'阅读理解'}
tasks=[];pas={};exams=[]
from PIL import Image
import os
PD={'2025-12':'p1225','2026-01':'p0126','2026-03':'p0315','2026-04':'p0426'}
def save_img(date,n,spec):
    d='/home/claude/phys/'+PD[date]; figs=json.load(open('/home/claude/phys/figs_'+PD[date][1:]+'.json'))
    boxes=[]
    for part in spec.split('+'):
        if part.startswith('#'): boxes.append(figs[int(part[1:])])
        else:
            pi,y0,y1,x0,x1=map(int,part[1:].split(':')); boxes.append([pi,y0,y1,x0,x1])
    pi=boxes[0][0]; im=Image.open(f'{d}/p-{pi+1:02d}.png').convert('L'); W,H=im.size; pad=int(W*0.012)
    y0=max(0,min(b[1] for b in boxes)-pad); y1=min(H,max(b[2] for b in boxes)+pad); x0=max(0,min(b[3] for b in boxes)-pad); x1=min(W,max(b[4] for b in boxes)+pad)
    im=im.crop((x0,y0,x1,y1))
    mw=900
    if im.width>mw: im=im.resize((mw,int(im.height*mw/im.width)),Image.LANCZOS)
    os.makedirs('/home/claude/csca-site/img',exist_ok=True)
    name=f'img/p{date}-{n}.jpg'; im.save('/home/claude/csca-site/'+name,quality=72,optimize=True); return name
for f in sorted(glob.glob('[mlp]_*.txt')):
    s=None;date=None;opts=None;cnt=0
    for line in open(f,encoding='utf-8'):
        line=line.rstrip('\n')
        if not line.strip(): continue
        if line.startswith('@'):
            s,date=line[1:].split(); continue
        if line.startswith('O '): opts=line[2:].split(';;'); continue
        if line.startswith('P '):
            p=split(line[2:]); pid=f'{s}{date}{p[0]}'; pas[pid]={'zh':p[1],'ru':p[2] if len(p)>2 else ''}; continue
        p=split(line)
        n,tp,q,ans,o,e=p[:6]; pid=None; img=''
        if len(p)>6 and p[6]:
            if s=='p': img=save_img(date,n,p[6])
            else: pid=f'{s}{date}{p[6]}'
        o=o.split(';;') if o else list(opts)
        k='ABCDEF'.index(ans); assert k<len(o),(f,n)
        o=[o[k]]+o[:k]+o[k+1:]
        tasks.append([s,TM[tp],q,o,'',e,pid,f'{date}·{n}']+([img] if img else [])); cnt+=1
    exams.append({'s':s,'d':date,'n':cnt})
with open('../csca-site/data/real.js','w',encoding='utf-8') as fo:
    fo.write('/* Задания реальных экзаменов CSCA (по присланным материалам). Формат как TASKS_BASE + источник «дата·номер». Первый вариант — верный. */\n')
    fo.write('window.REAL_EXAMS = '+json.dumps(exams,ensure_ascii=False)+';\n')
    fo.write('Object.assign(window.PASSAGES = window.PASSAGES || {}, '+json.dumps(pas,ensure_ascii=False,separators=(',',':'))+');\n')
    fo.write('window.TASKS_REAL = '+json.dumps(tasks,ensure_ascii=False,separators=(',',':'))+';\n')
print(len(tasks),exams)
