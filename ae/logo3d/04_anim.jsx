// PASSO 4: o movimento de revelação no RIG_LOGO: chega de longe, por baixo, girando em X/Y/Z, e assenta de frente
// para a câmera em CFG.SETTLE num ease-out longo e macio. Duas chaves por propriedade => sem passar do ponto.
// A chave 1 sai a 4x (posição) / 3,5x (rotação) a velocidade média com alça curta, então o ícone CHEGA com
// embalo (perspectiva pura acelera uma aproximação em z na tela; partir do zero parece decolagem).
// Sem opacidade aqui: toda camada 3D fica em 100 %. O fade-in mora na comp mestre 2D (passo 7).
// Profundidade de campo: a abertura da câmera vai de 40 a 0 até CFG.SETTLE (longe = macio, parado = nítido).
var LOGO3D_DIR = File($.fileName).parent.fsName;
$.evalFile(new File(LOGO3D_DIR + "/lib.jsxinc"));

icRun("04_anim", function (log) {
  var comp = icComp();
  var rig = icLayer(comp, "RIG_LOGO");
  var tr = icTr(rig);
  var T1 = IC.SETTLE;

  function keys(prop, v0, v1, outInf, inInf, startSpeed) {
    while (prop.numKeys > 0) prop.removeKey(1);
    prop.expression = "";
    prop.setValueAtTime(0, v0);
    prop.setValueAtTime(T1, v1);
    var dims = (prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL || prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.OneD) ? 1 : v0.length;
    var a = [], b = [];
    for (var d = 0; d < dims; d++) { a.push(new KeyframeEase(startSpeed || 0, outInf)); b.push(new KeyframeEase(0, inInf)); }
    prop.setInterpolationTypeAtKey(1, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
    prop.setInterpolationTypeAtKey(2, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
    prop.setTemporalEaseAtKey(1, a, a);
    prop.setTemporalEaseAtKey(2, b, b);
  }

  var P0 = [IC.W / 2, IC.H / 2 + 300, 1100], P1 = [IC.W / 2, IC.H / 2, 0];
  var pathLen = Math.sqrt(300 * 300 + 1100 * 1100);
  var pos = tr.property("ADBE Position");
  keys(pos, P0, P1, 10, 90, 4.0 * pathLen / T1);
  pos.setSpatialTangentsAtKey(1, [0, 0, 0], [0, 0, 0]);   // caminho reto, sem curva automática
  pos.setSpatialTangentsAtKey(2, [0, 0, 0], [0, 0, 0]);
  try { pos.setSpatialAutoBezierAtKey(1, false); pos.setSpatialAutoBezierAtKey(2, false); } catch (e1) {}

  var R = { x: -26, y: 40, z: -5 };
  keys(tr.property("ADBE Rotate X"), R.x, 0, 12, 86, -3.5 * R.x / T1);
  keys(tr.property("ADBE Rotate Y"), R.y, 0, 10, 90, -3.5 * R.y / T1);
  keys(tr.property("ADBE Rotate Z"), R.z, 0, 12, 84, -3.5 * R.z / T1);

  var op = tr.property("ADBE Opacity");
  while (op.numKeys > 0) op.removeKey(1);
  op.setValue(100);

  var cam = icLayer(comp, "CAM");
  var ap = cam.property("ADBE Camera Options Group").property("ADBE Camera Aperture");
  while (ap.numKeys > 0) ap.removeKey(1);
  ap.setValueAtTime(0, 40);
  ap.setValueAtTime(T1, 0);
  ap.setTemporalEaseAtKey(1, [new KeyframeEase(0, 30)], [new KeyframeEase(0, 30)]);
  ap.setTemporalEaseAtKey(2, [new KeyframeEase(0, 80)], [new KeyframeEase(0, 80)]);

  // Conferência: amostra o movimento; precisa ser monotônico (sem passar do ponto).
  var prev = null, mono = true, maxAt = 0, maxSp = 0;
  for (var f = 0; f <= Math.round(T1 * IC.FPS) + 4; f++) {
    var t = f / IC.FPS;
    var p = pos.valueAtTime(t, false), ry = tr.property("ADBE Rotate Y").valueAtTime(t, false);
    if (prev) {
      var spd = Math.sqrt(Math.pow(p[0] - prev[0], 2) + Math.pow(p[1] - prev[1], 2) + Math.pow(p[2] - prev[2], 2));
      if (spd > maxSp) { maxSp = spd; maxAt = f; }
      if (ry > prev[3] + 1e-6 || p[2] > prev[2] + 1e-6) mono = false;
    }
    prev = [p[0], p[1], p[2], ry];
  }
  log("monotônico " + mono + " | pico " + maxSp.toFixed(2) + " px/quadro no quadro " + maxAt);

  icShow(comp, 0.30);
  icSave(log);
});
