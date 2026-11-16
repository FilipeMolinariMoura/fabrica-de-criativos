// PASSO 2: o bloco do ícone (superelipse tipo iOS, cor CFG.CORES.tile) com borda fina e uma espessura física
// de CFG.EDGE_DEPTH px feita de fatias empilhadas atrás da face (só aparece enquanto o ícone gira).
// Com CFG.TILE = false o passo só limpa o que houver e segue (o logo flutua sozinho).
var LOGO3D_DIR = File($.fileName).parent.fsName;
$.evalFile(new File(LOGO3D_DIR + "/lib.jsxinc"));

icRun("02_tile", function (log) {
  var comp = icComp();
  icRemove(comp, "TILE_");
  var oldPc = icItem("TILE_FACE_PC"); if (oldPc) oldPc.remove();
  if (!CFG.TILE) { log("CFG.TILE = false: sem bloco"); icSave(log); return; }
  var rig = icLayer(comp, "RIG_LOGO");
  var S = IC.TILE;

  // Fatias da espessura, de trás para a frente (z cresce para longe da câmera).
  var N = IC.EDGE_DEPTH;
  for (var k = N; k >= 1; k--) {
    var f = (k - 1) / (N - 1);
    var g = 0.875 - 0.095 * f;   // cinza mais claro perto da face, mais escuro atrás: lê como parede lateral
    var sl = icSquircleLayer(comp, "TILE_EDGE_" + (k < 10 ? "0" : "") + k, S - 2 * f, { fill: [g, g, g] });
    sl.threeDLayer = true;
    sl.motionBlur = true;
    sl.parent = rig;
    icTr(sl).property("ADBE Position").setValue([0, 0, k * (IC.EDGE_DEPTH / N)]);
    icMat(sl, false);
    sl.shy = true;
    // escondidas atrás da face quando o ícone fica de frente: somem ali, para o quadro parado ser só a face
    var op = icTr(sl).property("ADBE Opacity");
    op.setValueAtTime(IC.SETTLE + 0.06, 100);
    op.setValueAtTime(IC.SETTLE + 0.20, 0);
  }

  // Face: precomp 2D (TILE_FACE_PC) para o reflexo do passo 5 morar DENTRO dela com Preserve Transparency:
  // o reflexo nunca põe um pixel fora da silhueta do bloco. Grupos de cima para baixo: aro branco, aro escuro, face.
  var FS = S + 20;
  var pc = app.project.items.addComp("TILE_FACE_PC", FS, FS, 1, IC.DUR, IC.FPS);
  var face = pc.layers.addShape();
  face.name = "face";
  icTr(face).property("ADBE Position").setValue([FS / 2, FS / 2]);
  function grp(name, size, fill, stroke, sw, sop) {
    var gg = face.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    gg.name = name;
    var v = gg.property("ADBE Vectors Group");
    v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(icSquircleShape(size, 5, 480));
    if (fill) {
      v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(fill);
    } else {
      var st = v.addProperty("ADBE Vector Graphic - Stroke");
      st.property("ADBE Vector Stroke Color").setValue(stroke);
      st.property("ADBE Vector Stroke Width").setValue(sw);
      st.property("ADBE Vector Stroke Opacity").setValue(sop);
    }
  }
  grp("aro branco", S - 5, null, [1, 1, 1], 2, 85);
  grp("aro escuro", S - 1, null, [0, 0, 0], 1.25, 7);
  grp("face", S, icHex(IC.COLORS.tile));

  var fl = comp.layers.add(pc);
  fl.name = "TILE_FACE";
  fl.threeDLayer = true;
  fl.motionBlur = true;
  fl.quality = LayerQuality.BEST;
  fl.samplingQuality = LayerSamplingQuality.BICUBIC;
  fl.parent = rig;
  icTr(fl).property("ADBE Anchor Point").setValue([FS / 2, FS / 2, 0]);
  icTr(fl).property("ADBE Position").setValue([0, 0, 0]);
  icMat(fl, true);

  log("bloco montado: " + N + " fatias + face");
  icShow(comp, 0);
  icSave(log);
});
