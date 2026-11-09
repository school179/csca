import re,sys
def split(line):
    out=[];buf='';d=0;i=0
    while i<len(line):
        if line.startswith('[[',i): d+=1;buf+='[[';i+=2;continue
        if line.startswith(']]',i) and d: d-=1;buf+=']]';i+=2;continue
        c=line[i]
        if c=='|' and d==0: out.append(buf);buf=''
        else: buf+=c
        i+=1
    out.append(buf);return out
if __name__=='__main__':
    for f in sys.argv[1:]:
        for n,l in enumerate(open(f),1):
            l=l.rstrip('\n')
            if not l or l[0] in '@OP': continue
            p=split(l)
            if len(p) not in (6,7) or p[3] not in list('ABCDEF'): print(f,n,len(p),l[:90])
