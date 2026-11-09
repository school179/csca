"""Собирает data/vocab.js и data/tasks.js из исходных списков.
Запуск: python3 build/build_data.py (из корня сайта). Нужен пакет pypinyin."""
import json, re, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/csca'

# pinyin helper + полифоны из build_deck.py
src = open(os.path.join(SRC, 'build_deck.py'), encoding='utf-8').read()
src = src.split('def stable_id')[0].replace('import re, genanki, hashlib', 'import re')
exec(src)
load_phrases_dict({'倒数': [['dào'], ['shù']], '剧烈': [['jù'], ['liè']], '弹力': [['tán'], ['lì']],
                   '不计': [['bú'], ['jì']], '分别为': [['fēn'], ['bié'], ['wéi']], '视为': [['shì'], ['wéi']],
                   '记为': [['jì'], ['wéi']], '称为': [['chēng'], ['wéi']], '叫做': [['jiào'], ['zuò']],
                   '恰好': [['qià'], ['hǎo']], '刚好': [['gāng'], ['hǎo']], '曲线': [['qū'], ['xiàn']],
                   '撇': [['piě']], '估读': [['gū'], ['dú']], '读数': [['dú'], ['shù']], '一定': [['yī'], ['dìng']], '足够长': [['zú'], ['gòu'], ['cháng']],
                   '弦长': [['xián'], ['cháng']], '棱长': [['léng'], ['cháng']], '一般': [['yī'], ['bān']], '第一': [['dì'], ['yī']]})
load_phrases_dict({'不计': [['bù'], ['jì']]})

vocab = {}   # zh -> dict
order = []
def add(zh, ru, deck, topic='', ex=''):
    zh = re.sub(r'\(.*?\)', '', zh).strip()
    if not zh or '…' in zh:
        return
    if zh in vocab:
        v = vocab[zh]
        if deck not in v['d']:
            v['d'].append(deck)
        if ex and not v['ex']:
            v['ex'] = ex
        return
    p = re.sub(r'\bzi\b', 'zǐ', py(zh))
    if zh.startswith('g取'): p = 'g qǔ 10 m/s²'
    if zh.startswith('α'): p = 'α ' + p
    vocab[zh] = {'zh': zh, 'py': p, 'ru': ru, 'd': [deck], 't': topic, 'ex': ex}
    order.append(zh)

# 1. Язык условий (самое важное — идёт первым)
PHRASES = """已知|дано, известно|已知函数 f(x) = 2x + 1，求 f(3) 的值。
求|найти|求 a 的取值范围。
下列说法正确的是|какое из утверждений верно|关于惯性，下列说法正确的是（　　）
下列说法错误的是|какое из утверждений неверно|
下列说法不正确的是|какое из утверждений неверно|
若|если|若 a > 0，则 f(x) 单调递增。
则|то, тогда|若 A ⊆ B，则 A ∩ B = A。
设|пусть|设物体的质量为 m。
令|положим|令 x = 0，得 y = 1。
满足|удовлетворяет (условию)|满足条件的集合 M 有几个？
分别为|соответственно равны|位移大小和路程分别为（　　）
取值范围|множество значений (параметра)|求实数 a 的取值范围。
恒成立|выполняется при всех значениях|x² + ax + 1 > 0 恒成立
有且仅有|ровно один|
至少|не менее, хотя бы|至少有一人命中的概率
至多|не более|
不超过|не превосходит|
所在的区间|промежуток, в котором лежит|零点所在的区间是
一定成立|обязательно выполняется|下列不等式一定成立的是
可能|может, возможно|
不计空气阻力|сопротивлением воздуха пренебречь|
忽略|пренебречь|忽略摩擦
由静止释放|отпускают из состояния покоя|
由静止开始|начинает движение из покоя|物体由静止开始做匀加速直线运动
光滑|гладкий (без трения)|光滑水平面
足够长|достаточно длинный|足够长的木板
恰好|ровно, как раз|恰好有 1 名女生
刚好|как раз, точно|
匀速|равномерно, с постоянной скоростью|匀速直线运动
竖直向上|вертикально вверх|竖直向上抛出
竖直向下|вертикально вниз|
水平向右|горизонтально вправо|
水平抛出|бросить горизонтально|以 10 m/s 的速度水平抛出
大小为|величина равна|加速度大小为 2 m/s²
方向|направление|
所受的|действующий на (о силе)|物体所受的合力为零
视为|считать, рассматривать как|物体可视为质点
处于静止状态|находится в покое|
保持不变|остаётся неизменным|温度保持不变
变为原来的|становится (по сравнению с исходным)|周期变为原来的 2 倍
原来的|исходный, первоначальный|
增大|увеличивается|
减小|уменьшается|
不变|не меняется|
关于原点对称|симметричен относительно начала координат|
经过点|проходит через точку|直线经过点 (1, 2)
过点|через точку|过点 (2, 0) 作圆的切线
交于点|пересекаются в точке|
相切于|касается в точке|
截得的|отсекаемый|被直线截得的弦长
任取|наугад выбрать|从中任取两个数
互不相同|попарно различные|
排成一排|выстроить в ряд|5 名同学排成一排
化简|упростить|
计算|вычислить|
判断|определить, выяснить|判断函数的奇偶性
比较大小|сравнить по величине|
的值为|значение равно|
的解集为|множество решений|
的定义域为|область определения|
其中|где, среди них|其中 a > 0
分别|соответственно|
依次|по порядку|
根据短文|по тексту|
意思是|значит, означает|
读音|чтение (иероглифа)|
排成一段通顺的话|составить связный абзац|
最恰当的|наиболее подходящий|
g取10 m/s²|принять g = 10 м/с²|"""
for line in PHRASES.strip().split('\n'):
    zh, ru, ex = (line.split('|') + ['', ''])[:3]
    add(zh, ru, 'q', 'Язык условий', ex)

# 2. Словари из прошлых материалов
deckmap = {'Математика': 'm', 'Физика': 'p', 'Китайский': 'l'}
for fn in ['site_terms.txt', 'terms.txt']:
    sec = None
    for line in open(os.path.join(SRC, fn), encoding='utf-8'):
        line = line.rstrip('\n')
        if not line.strip():
            continue
        if line.startswith('# '):
            sec = line[2:].strip()
            continue
        if '文科' in (sec or ''):
            continue
        parts = [p.strip() for p in line.split('|')]
        top = sec.split('::')
        d = deckmap.get(top[0], 'l')
        add(parts[0], parts[1], d, top[1] if len(top) > 1 else '', ' | '.join(parts[2:]).strip() if len(parts) > 2 else '')

# 3. Слова из рабочей тетради по математике
mb = open(os.path.join(SRC, 'mathbook.py'), encoding='utf-8').read().split('# ─── сборка')[0]
mb = re.sub(r"exec\(open\(.*?\)\n", "", mb, count=1)
ns = {}
exec(mb, ns)
T = ns['T']
for t in T:
    for zh, ru in t['w']:
        add(zh, ru, 'm', t['zh'])

V = [vocab[z] for z in order]
for i, v in enumerate(V):
    v['id'] = i
with open(os.path.join(ROOT, 'data', 'vocab.js'), 'w', encoding='utf-8') as f:
    f.write('/* Словарь: zh, py — пиньинь, ru, d — колоды (q язык условий, m математика, p физика, l китайский), t — тема, ex — пример */\n')
    f.write('window.VOCAB = ' + json.dumps(V, ensure_ascii=False, separators=(',', ':')) + ';\n')

# 4. Задачи: базовый банк + задачи из рабочей тетради по математике
base = open(os.path.join(ROOT, 'build', 'tasks_base.js'), encoding='utf-8').read()
extra = []
for t in T:
    for q, opts, sol in t['mcq']:
        extra.append(['m', t['zh'], q, opts, '', sol])
    zh, ru = t['term']
    # задания на перевод условий идут в отдельный список
with open(os.path.join(ROOT, 'data', 'tasks.js'), 'w', encoding='utf-8') as f:
    f.write(base)
    f.write('\nwindow.TASKS_EXTRA = ' + json.dumps(extra, ensure_ascii=False, separators=(',', ':')) + ';\n')
    reads = [{'s': 'm', 't': t['zh'], 'zh': t['term'][0], 'ru': t['term'][1]} for t in T]
    f.write('window.READING = ' + json.dumps(reads, ensure_ascii=False, separators=(',', ':')) + ';\n')

from collections import Counter
print('vocab', len(V), Counter(d for v in V for d in v['d']))
print('extra tasks', len(extra))
