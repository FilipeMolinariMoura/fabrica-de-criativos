// Flags do Chromium para os filmes 3D (three.js na GPU), por sistema operacional.
// Usado por lib/3d/render.mjs e pelo teste de WebGL do `node fabrica.mjs verificar`, para os dois
// abrirem o navegador exatamente do mesmo jeito.
//
//   macOS    ANGLE sobre Metal
//   Windows  ANGLE sobre Direct3D 11
//   Linux    o ANGLE escolhe sozinho (OpenGL ou Vulkan, conforme o driver)
//
// Para testar outro caminho sem mexer no código, defina FABRICA_ANGLE (ex.: vulkan, gl, d3d11, metal,
// swiftshader). Sem GPU utilizável o Chromium cai no SwiftShader (software): funciona, mas bem mais devagar.

export const ANGLE_PADRAO = { darwin: 'metal', win32: 'd3d11' };

export function argsChromium3D(plataforma = process.platform, angle = process.env.FABRICA_ANGLE) {
  const escolhido = (angle || ANGLE_PADRAO[plataforma] || '').trim();
  return ['--font-render-hinting=none', '--disable-lcd-text',
    ...(escolhido ? [`--use-angle=${escolhido}`] : []),
    '--enable-gpu', '--ignore-gpu-blocklist'];
}

// O nome do renderizador WebGL diz se a GPU está em uso ou se caiu no software.
export function renderizadorEmSoftware(nome) {
  return /swiftshader|llvmpipe|softpipe|software|basic render driver/i.test(String(nome || ''));
}
