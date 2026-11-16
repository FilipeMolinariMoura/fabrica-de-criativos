// PASSO 5: reflexo de luz macio cruzando a face do ícone, de SETTLE + 0,20 s a SETTLE + 0,80 s.
// Uma faixa inclinada (28°, gaussiana, larga) desenhada duas vezes, para seguir contínua entre as camadas:
//   * bloco: DENTRO da precomp TILE_FACE_PC, brilho branco em ADD com Preserve Transparency
//            => só clareia pixels que já são do bloco (nada vaza da borda);
//   * logo:  DENTRO de LOGO_PAD, faixa na cor CFG.CORES.destaqueClaro em LIGHTEN (85 %, Preserve Transparency)
//            => as cores do logo sobem em direção a esse tom e nunca passam dele; o branco fica branco.
// A opacidade da faixa é 0 fora da passagem, então todo quadro depois dela fica intocado.
var LOGO3D_DIR = File($.fileName).parent.fsName;
$.evalFile(new File(LOGO3D_DIR + "/lib.jsxinc"));

icRun("05_sweep", function (log) {
  var comp = icComp();
  var T0 = IC.SETTLE + 0.20, T1 = IC.SETTLE + 0.80;
  var X0 = -500, X1 = 500;   // centro da faixa no espaço do rig
  var TILT = 28, CORE = 110, SOFT = 70;

  // Faixa = retângulo + desfoque gaussiano, camada 2D dentro de uma precomp; toPx: espaço do rig -> px da precomp.
  function band(c, name, toPx, scale, peak, color, mode) {
    for (var i = c.numLayers; i >= 1; i--) if (c.layer(i).name === name) c.layer(i).remove();
    var l = c.layers.addShape();
    l.name = name;
    var g = l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    g.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
    g.property("ADBE Vectors Group").property(1).property("ADBE Vector Rect Size").setValue([CORE / scale, 2400 / scale]);
    g.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
    g.property("ADBE Vectors Group").property(2).property("ADBE Vector Fill Color").setValue(color);
    l.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
    l.property("ADBE Effect Parade").property(1).property("ADBE Gaussian Blur 2-0001").setValue(SOFT / scale);
    l.property("ADBE Effect Parade").property(1).property("ADBE Gaussian Blur 2-0003").setValue(0);
    icTr(l).property("ADBE Rotate Z").setValue(TILT);
    var p = icTr(l).property("ADBE Position");
    p.setValueAtTime(T0, toPx([X0, 0]));
    p.setValueAtTime(T1, toPx([X1, 0]));
    var ez = [new KeyframeEase(0, 20)];
    p.setTemporalEaseAtKey(1, ez, ez);
    p.setTemporalEaseAtKey(2, ez, ez);
    var o = icTr(l).property("ADBE Opacity");
    o.setValueAtTime(T0 - 0.02, 0);
    o.setValueAtTime(T0 + 0.14, peak);
    o.setValueAtTime(T1 - 0.14, peak);
    o.setValueAtTime(T1 + 0.02, 0);
    l.blendingMode = mode;
    l.moveToBeginning();
    l.preserveTransparency = true;
    return l;
  }

  var pc = icItem("TILE_FACE_PC");
  if (pc) {
    band(pc, "faixa", function (p) { return [p[0] + pc.width / 2, p[1] + pc.height / 2]; }, 1, 62, [1, 0.99, 0.975], BlendingMode.ADD);
    log("faixa no bloco (ADD, Preserve Transparency)");
  }
  var pad = icItem("LOGO_PAD");
  if (!pad) throw new Error("LOGO_PAD não existe; rode 03_logo.jsx");
  var lg = icLayer(comp, "LOGO");
  var sc = icTr(lg).property("ADBE Scale").value[0] / 100;
  band(pad, "faixa", function (p) { return [pad.width / 2 + p[0] / sc, pad.height / 2 + p[1] / sc]; }, sc, 85, icHex(IC.COLORS.destaqueClaro), BlendingMode.LIGHTEN);
  log("faixa no logo (" + IC.COLORS.destaqueClaro + ", LIGHTEN 85 %), escala " + sc.toFixed(4));

  icShow(comp, (T0 + T1) / 2);
  icSave(log);
});
