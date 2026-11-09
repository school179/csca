import json,glob,re
from dsl import split
TM={'set':'集合与常用逻辑','ineq':'不等式','func':'函数的概念与性质','explog':'指数函数与对数函数','trig':'三角函数与解三角形','seq':'数列','line':'直线与圆','conic':'圆锥曲线','vec':'平面向量','cplx':'复数','prob':'计数原理与概率','stat':'统计','deriv':'导数及其应用','solid':'立体几何',
'hz':'识解汉字','xc':'选词填空','bx':'辨析词语','bq':'补全语句','cd':'选词成段','yd':'阅读理解'}
tasks=[];pas={};exams=[]
for f in sorted(glob.glob('[ml]_*.txt')):
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
        n,tp,q,ans,o,e=p[:6]; pid=(f'{s}{date}{p[6]}' if len(p)>6 and p[6] else None)
        o=o.split(';;') if o else list(opts)
        k='ABCDEF'.index(ans); assert k<len(o),(f,n)
        o=[o[k]]+o[:k]+o[k+1:]
        tasks.append([s,TM[tp],q,o,'',e,pid,f'{date}·{n}']); cnt+=1
    exams.append({'s':s,'d':date,'n':cnt})
with open('../csca-site/data/real.js','w',encoding='utf-8') as fo:
    fo.write('/* Задания реальных экзаменов CSCA (по присланным материалам). Формат как TASKS_BASE + источник «дата·номер». Первый вариант — верный. */\n')
    fo.write('window.REAL_EXAMS = '+json.dumps(exams,ensure_ascii=False)+';\n')
    fo.write('Object.assign(window.PASSAGES = window.PASSAGES || {}, '+json.dumps(pas,ensure_ascii=False,separators=(',',':'))+');\n')
    fo.write('window.TASKS_REAL = '+json.dumps(tasks,ensure_ascii=False,separators=(',',':'))+';\n')
print(len(tasks),exams)
