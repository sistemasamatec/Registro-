import sys, re, os
mode = sys.argv[1] if len(sys.argv) > 1 else 'artifact'
head = open('parts/p1_head.html', encoding='utf-8').read()
logo = open('logo256.b64.txt').read().strip()
assert logo.startswith('data:image/png;base64,')
names = ['p2_core.js','p3_ui.js','p4_modules.js','p4b_clientes.js','p4c_home_sig.js','p5_pdf.js','p6a_common.js']
names += ['p6_boot.js'] if mode == 'artifact' else ['p6_cloud.js']
names += ['p7_tail.js']
js = '\n'.join(open('parts/'+p, encoding='utf-8').read() for p in names)
head = head.replace('__LOGO__', logo)
pre = ''
if mode == 'cloud':
    def rep(a, b):
        global head
        assert a in head, a[:50]
        head = head.replace(a, b)
    rep('Utilizador<input id="lgUser" name="username" type="text" autocomplete="username"', 'E-mail<input id="lgUser" name="username" type="email" autocomplete="username"')
    rep('Utilizador<input id="nuUser" type="text" autocapitalize="none" spellcheck="false" placeholder="ex.: joao.silva">', 'E-mail<input id="nuUser" type="email" autocapitalize="none" spellcheck="false" placeholder="joao@exemplo.com">')
    rep('<label for="nuPass">Senha inicial (mínimo 6)', '<label for="nuPass">Senha inicial (mínimo 6)')
    m = re.search(r'<p class="hint">A senha identifica quem.*?</p>', head, re.S)
    assert m
    head = head.replace(m.group(0), '<p class="hint">O acesso é protegido pelo Supabase: sem entrar com e-mail e senha, a base de dados não devolve nenhum dado. Cada pessoa só vê o que o seu perfil permite. Desactivar uma conta bloqueia-a de imediato.</p>')
    pre = '<script src="config.js"></script>\n'
    shell_head = ('<!doctype html>\n<html lang="pt">\n<head>\n<meta charset="utf-8">\n'
      '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
      '<meta name="theme-color" content="#1b3a57">\n<link rel="manifest" href="manifest.webmanifest">\n'
      '<link rel="icon" href="icon-192.png">\n<link rel="apple-touch-icon" href="icon-192.png">\n'
      '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}</style>\n')
    head = shell_head + head.replace('<title>Relatórios AMA TEC</title>','<title>AMA TEC Oficina</title>')
full = head + '\n' + pre + '<script>\n(function(){\'use strict\';\n' + js + '\n})();\n</script>\n' + ('</body></html>\n' if mode == 'cloud' else '')
assert '__LOGO__' not in full
final = '\n'.join(l for l in full.split('\n') if 'window.__amatec' not in l)
if mode == 'artifact':
    os.makedirs('../dist', exist_ok=True)
    open('../dist/oficina-local.html', 'w', encoding='utf-8').write(final)
    out_test = os.devnull
else:
    open('../site/index.html', 'w', encoding='utf-8').write(final)
    out_test = os.devnull
wrap = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'
open(out_test, 'w', encoding='utf-8').write(wrap + full + '</body></html>')
print(mode, 'final', len(final), 'test', len(full))
