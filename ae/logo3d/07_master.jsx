// PASSO 7: comp mestre 2D LOGO_MASTER (transparente): LOGO_3D aninhada intocada como UMA camada, e o fade-in
// nessa única camada. Como o ícone 3D inteiro vira uma imagem antes do fade, nenhuma camada (fatias, sombras,
// espessura do logo) transparece por outra. O quadro 0 já começa em 20 % (sem quadro vazio); 100 % em 0,22 s.
var LOGO3D_DIR = File($.fileName).parent.fsName;
$.evalFile(new File(LOGO3D_DIR + "/lib.jsxinc"));

icRun("07_master", function (log) {
  var comp = icComp();
  var old = icItem(IC.MASTER); if (old) old.remove();
  var m = app.project.items.addComp(IC.MASTER, IC.W, IC.H, 1, IC.DUR, IC.FPS);
  m.bgColor = icHex(IC.COLORS.fundo);

  var bg = m.layers.addSolid(icHex(IC.COLORS.fundo), "FUNDO_GUIA (nao renderiza)", IC.W, IC.H, 1, IC.DUR);
  bg.guideLayer = true;
  bg.locked = true;

  var l = m.layers.add(comp);
  l.name = "LOGO_3D";
  l.quality = LayerQuality.BEST;
  l.collapseTransformation = false; // achatada: é isso que deixa o fade limpo
  var op = icTr(l).property("ADBE Opacity");
  op.setValueAtTime(0, 20);
  op.setValueAtTime(0.22, 100);
  op.setTemporalEaseAtKey(1, [new KeyframeEase(0, 20)], [new KeyframeEase(0, 20)]);
  op.setTemporalEaseAtKey(2, [new KeyframeEase(0, 60)], [new KeyframeEase(0, 60)]);
  log("mestre " + m.name + " " + m.width + "x" + m.height + " @" + m.frameRate + " " + m.duration + " s");

  m.openInViewer();
  m.time = 0.12;
  icSave(log);
});
