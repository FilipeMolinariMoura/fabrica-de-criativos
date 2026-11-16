// Ajuda de desenvolvimento: salva stills de LOGO_MASTER em ae/logo3d/logs/preview/ (tempos abaixo, em quadros).
var LOGO3D_DIR = File($.fileName).parent.fsName;
$.evalFile(new File(LOGO3D_DIR + "/lib.jsxinc"));

icRun("preview", function (log) {
  var comp = icItem(IC.MASTER) || icComp();
  var dir = new Folder(IC.LOGS + "/preview");
  if (!dir.exists) dir.create();
  var F = [0, 6, 12, 30, 60, 78, 92, 110, 122, IC.DUR * IC.FPS - 1];
  for (var i = 0; i < F.length; i++) {
    var f = new File(dir.fsName + "/q_" + F[i] + ".png");
    comp.saveFrameToPng(F[i] / IC.FPS, f);
    log("quadro " + F[i] + " -> " + f.fsName);
  }
});
