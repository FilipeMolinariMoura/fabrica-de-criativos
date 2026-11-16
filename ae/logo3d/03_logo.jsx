// PASSO 3: o logo como camada 3D própria, flutuando CFG.LOGO_Z px à frente do bloco (paralaxe), com uma
// espessura de 4 fatias atrás dele e uma sombra de contato macia impressa na face do bloco.
// Fonte: CFG.LOGO (PNG com alfa, SVG, AI ou PSD). Sem arquivo, desenha uma forma: círculo na cor de destaque
// com CFG.LETRA em branco. Dica: SVG às vezes entra no AE como raster pequeno; para nitidez, prefira um PNG
// grande (scripts/util/svg2png.mjs logo.svg logo.png 1200).
var LOGO3D_DIR = File($.fileName).parent.fsName;
$.evalFile(new File(LOGO3D_DIR + "/lib.jsxinc"));

icRun("03_logo", function (log) {
  var comp = icComp();
  icRemove(comp, "LOGO");
  var rig = icLayer(comp, "RIG_LOGO");
  var pad = icItem("LOGO_PAD"); if (pad) pad.remove();

  // Conteúdo do logo dentro de uma precomp com folga (espaço para a sombra desfocada).
  var LW, LH;
  if (IC.LOGO) {
    var arq = new File(IC.LOGO);
    if (!arq.exists) throw new Error("logo não encontrado: " + IC.LOGO);
    var foot = null;
    for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i).name === arq.name) foot = app.project.item(i);
    if (!foot) foot = app.project.importFile(new ImportOptions(arq));
    try { foot.mainSource.alphaMode = AlphaMode.STRAIGHT; } catch (ea) { log("alphaMode: " + ea.message); }
    LW = foot.width; LH = foot.height;
    log("logo " + foot.name + " " + LW + "x" + LH);
    pad = app.project.items.addComp("LOGO_PAD", LW + 200, LH + 200, 1, IC.DUR, IC.FPS);
    var fl = pad.layers.add(foot);
    icTr(fl).property("ADBE Position").setValue([pad.width / 2, pad.height / 2]);
    fl.quality = LayerQuality.BEST;
    fl.samplingQuality = LayerSamplingQuality.BICUBIC;
    if (foot.height < 600) log("aviso: logo com menos de 600 px de altura pode sair borrado; use um PNG maior");
  } else {
    LW = LH = 1000;
    pad = app.project.items.addComp("LOGO_PAD", LW + 200, LH + 200, 1, IC.DUR, IC.FPS);
    var sh = pad.layers.addShape();
    sh.name = "forma";
    var gg = sh.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var v = gg.property("ADBE Vectors Group");
    v.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([LW, LH]);
    v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(icHex(IC.COLORS.destaque));
    icTr(sh).property("ADBE Position").setValue([pad.width / 2, pad.height / 2]);
    var tl = pad.layers.addText(CFG.LETRA || "A");
    var tp = tl.property("ADBE Text Properties").property("ADBE Text Document");
    var td = tp.value;
    td.fontSize = 620; td.applyFill = true; td.fillColor = [1, 1, 1]; td.applyStroke = false;
    td.justification = ParagraphJustification.CENTER_JUSTIFY;
    tp.setValue(td);
    var r = tl.sourceRectAtTime(0, false);
    icTr(tl).property("ADBE Position").setValue([pad.width / 2 - (r.left + r.width / 2), pad.height / 2 - (r.top + r.height / 2)]);
    log("sem CFG.LOGO: forma desenhada (círculo " + IC.COLORS.destaque + " + letra " + CFG.LETRA + ")");
  }
  var PW = pad.width, PH = pad.height;

  // Altura na tela IC.LOGO_H parado: compensa a ampliação de perspectiva de z = LOGO_Z.
  var persp = -IC.CAM_Z / (-IC.CAM_Z + IC.LOGO_Z);
  var sc = (IC.LOGO_H / LH) / persp * 100;
  log("escala do logo " + sc.toFixed(3) + "% (perspectiva " + persp.toFixed(4) + ")");

  function logoLayer(name, z) {
    var l = comp.layers.add(pad);
    l.name = name;
    l.threeDLayer = true;
    l.motionBlur = true;
    l.quality = LayerQuality.BEST;
    l.samplingQuality = LayerSamplingQuality.BICUBIC;
    l.parent = rig;
    icTr(l).property("ADBE Anchor Point").setValue([PW / 2, PH / 2, 0]);
    icTr(l).property("ADBE Position").setValue([0, 0, z]);
    icTr(l).property("ADBE Scale").setValue([sc, sc, 100]);
    return l;
  }

  // Sombra de contato no bloco: silhueta escura desfocada, logo à frente da face, deslocada para longe da luz.
  if (CFG.TILE) {
    var so = logoLayer("LOGO_SOMBRA", -0.5);
    var fx = so.property("ADBE Effect Parade");
    var fill = fx.addProperty("ADBE Fill");
    fill.property("ADBE Fill-0002").setValue(icHex(IC.COLORS.sombra).concat([1]));
    var bl = fx.addProperty("ADBE Gaussian Blur 2");
    bl.property("ADBE Gaussian Blur 2-0001").setValue(22 / (sc / 100));   // ~22 px na tela
    bl.property("ADBE Gaussian Blur 2-0003").setValue(0);
    icTr(so).property("ADBE Position").setValue([3, 6, -0.5]);
    icTr(so).property("ADBE Opacity").setValue(18);
    icMat(so, false);
  }

  // Espessura do logo: 4 fatias escuras logo atrás (só vistas enquanto gira, depois somem).
  var esp = icHex(IC.COLORS.espessura);
  for (var k = 4; k >= 1; k--) {
    var e = logoLayer("LOGO_ESPESSURA_" + k, IC.LOGO_Z + k);
    var d = 1 - 0.06 * k;
    e.property("ADBE Effect Parade").addProperty("ADBE Fill").property("ADBE Fill-0002").setValue([esp[0] * d, esp[1] * d, esp[2] * d, 1]);
    icMat(e, false);
    e.shy = true;
    var op = icTr(e).property("ADBE Opacity");
    op.setValueAtTime(IC.SETTLE + 0.06, 100);
    op.setValueAtTime(IC.SETTLE + 0.20, 0);
  }

  var main = logoLayer("LOGO", IC.LOGO_Z);
  icMat(main, true);

  log("camadas " + comp.numLayers);
  icShow(comp, 0);
  icSave(log);
});
