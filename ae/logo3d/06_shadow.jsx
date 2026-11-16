// PASSO 6: sombras macias e realistas, num tom quente e neutro (CFG.CORES.sombra) que assenta em fundo claro:
//   * SOMBRA_AMBIENTE: larga, macia, deslocada para baixo (a sombra principal);
//   * SOMBRA_CONTATO:  justa, logo abaixo do bloco;
//   * SOMBRA_AO:       oclusão ambiente bem leve em volta, sem deslocamento, para o bloco quase branco se
//                      separar do fundo quase branco também no topo e nas laterais.
// Todas andam com o ícone (filhas do rig, 40 px atrás; os tamanhos compensam a perspectiva) e crescem
// conforme o ícone chega perto do fundo. Sem bloco (CFG.TILE = false), a sombra é a silhueta do logo.
var LOGO3D_DIR = File($.fileName).parent.fsName;
$.evalFile(new File(LOGO3D_DIR + "/lib.jsxinc"));

icRun("06_shadow", function (log) {
  var comp = icComp();
  icRemove(comp, "SOMBRA_");
  var rig = icLayer(comp, "RIG_LOGO");
  var COL = icHex(IC.COLORS.sombra);
  var Z = 40, k = (-IC.CAM_Z + Z) / -IC.CAM_Z; // px da camada por px na tela, na profundidade Z
  var EXPR = 'var r = thisComp.layer("RIG_LOGO");\nvalue * ease(r.transform.position[2], 1100, 0, 0.25, 1);';

  function finish(l, name, blur, opac) {
    l.name = name;
    l.threeDLayer = true;
    l.motionBlur = true;
    l.parent = rig;
    var m = l.property("ADBE Material Options Group");
    m.property("ADBE Accepts Lights").setValue(0);
    m.property("ADBE Casts Shadows").setValue(0);
    var fxp = l.property("ADBE Effect Parade");
    var b = fxp.addProperty("ADBE Gaussian Blur 2");
    b.property("ADBE Gaussian Blur 2-0001").setValue(blur);
    b.property("ADBE Gaussian Blur 2-0003").setValue(0);
    icTr(l).property("ADBE Opacity").setValue(opac);
    icTr(l).property("ADBE Opacity").expression = EXPR;
    l.moveToEnd();
  }

  if (CFG.TILE) {
    var tiles = [["SOMBRA_AMBIENTE", 51, IC.TILE - 34, 70, 34], ["SOMBRA_CONTATO", 16, IC.TILE - 26, 16, 24], ["SOMBRA_AO", 2, IC.TILE, 24, 11]];
    for (var i = 0; i < tiles.length; i++) {
      var s = tiles[i];
      var l = icSquircleLayer(comp, s[0], s[2] * k, { fill: COL });
      icTr(l).property("ADBE Position").setValue([0, s[1] * k, Z]);
      finish(l, s[0], s[3] * k, s[4]);
      log(s[0] + " tamanho " + (s[2] * k).toFixed(1) + " desloc " + (s[1] * k).toFixed(1) + " opac " + s[4]);
    }
  } else {
    var pad = icItem("LOGO_PAD");
    var lg = icLayer(comp, "LOGO");
    var sc = icTr(lg).property("ADBE Scale").value[0];
    var sl = comp.layers.add(pad);
    icTr(sl).property("ADBE Anchor Point").setValue([pad.width / 2, pad.height / 2, 0]);
    icTr(sl).property("ADBE Position").setValue([0, 30 * k, Z]);
    icTr(sl).property("ADBE Scale").setValue([sc * k, sc * k, 100]);
    sl.property("ADBE Effect Parade").addProperty("ADBE Fill").property("ADBE Fill-0002").setValue(COL.concat([1]));
    finish(sl, "SOMBRA_LOGO", 40 / (sc / 100), 28);
    log("SOMBRA_LOGO (silhueta do logo)");
  }
  var bg = icLayer(comp, "FUNDO_GUIA (nao renderiza)");
  if (bg) { bg.locked = false; bg.moveToEnd(); bg.locked = true; }

  icShow(comp, IC.DUR - 0.01);
  icSave(log);
});
