// PASSO 1: projeto novo, comp LOGO_3D (CFG.W x CFG.H, CFG.FPS, CFG.DUR), câmera, luzes e o null de rig.
// Fecha o que estiver aberto SEM salvar (salve antes o que importa!) e salva em ae/logo3d/<CFG.AEP>.
var LOGO3D_DIR = File($.fileName).parent.fsName;
$.evalFile(new File(LOGO3D_DIR + "/lib.jsxinc"));

icRun("01_comp", function (log) {
  if (app.project) app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
  app.newProject();
  var proj = app.project;
  proj.bitsPerChannel = 16;

  var comp = proj.items.addComp(IC.COMP, IC.W, IC.H, 1, IC.DUR, IC.FPS);
  comp.bgColor = icHex(IC.COLORS.fundo);
  comp.renderer = "ADBE Advanced 3d"; // = Classic 3D (matchName legado): tem desfoque de movimento
  log("renderer " + comp.renderer + " de [" + comp.renderers.join(", ") + "]");
  comp.motionBlur = true;
  comp.shutterAngle = 180;
  comp.shutterPhase = -90;
  comp.motionBlurSamplesPerFrame = 16;
  comp.motionBlurAdaptiveSampleLimit = 128;
  comp.openInViewer();

  // Camada-guia: mostra o fundo do anúncio no visualizador, nunca sai no render.
  var bg = comp.layers.addSolid(icHex(IC.COLORS.fundo), "FUNDO_GUIA (nao renderiza)", IC.W, IC.H, 1, IC.DUR);
  bg.guideLayer = true;
  bg.locked = true;

  // Câmera de um nó, distância == zoom (z = 0 sai 1:1). Profundidade de campo rasa: o ícone longe fica
  // macio e chega nítido no plano de foco.
  var cam = comp.layers.addCamera("CAM", [IC.W / 2, IC.H / 2]);
  cam.autoOrient = AutoOrientType.NO_AUTO_ORIENT;
  icTr(cam).property("ADBE Position").setValue([IC.W / 2, IC.H / 2, IC.CAM_Z]);
  var co = cam.property("ADBE Camera Options Group");
  co.property("ADBE Camera Zoom").setValue(-IC.CAM_Z);
  co.property("ADBE Camera Depth of Field").setValue(1);
  co.property("ADBE Camera Focus Distance").setValue(-IC.CAM_Z + IC.LOGO_Z / 2);
  co.property("ADBE Camera Aperture").setValue(34);
  try { co.property("ADBE Camera Blur Level").setValue(100); } catch (eb) { log("blur level oculto (padrão 100)"); }

  // Luzes: ambiente + key * cos(ângulo) = exatamente 100 %, então o quadro parado mostra as cores reais da
  // marca, e o ícone girando ganha sombreado de verdade.
  var amb = comp.layers.addLight("LUZ_AMBIENTE", [IC.W / 2, IC.H / 2]);
  amb.lightType = LightType.AMBIENT;
  amb.property("ADBE Light Options Group").property("ADBE Light Intensity").setValue(52);
  amb.property("ADBE Light Options Group").property("ADBE Light Color").setValue([1, 1, 1]);

  var key = comp.layers.addLight("LUZ_KEY", [IC.W / 2, IC.H / 2]);
  key.lightType = LightType.PARALLEL;
  var dir = [0.30, -0.24, 1]; // de cima, à direita, pela frente
  var len = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1] + dir[2] * dir[2]);
  var cosA = dir[2] / len;
  icTr(key).property("ADBE Anchor Point").setValue([IC.W / 2, IC.H / 2, 0]);
  icTr(key).property("ADBE Position").setValue([IC.W / 2 + dir[0] * 2000, IC.H / 2 + dir[1] * 2000, -2000]);
  key.property("ADBE Light Options Group").property("ADBE Light Intensity").setValue(48 / cosA);
  key.property("ADBE Light Options Group").property("ADBE Light Color").setValue([1, 1, 1]);
  log("key cos " + cosA.toFixed(4) + " intensidade " + (48 / cosA).toFixed(3));

  // Null de rig: o ícone inteiro pendura nele.
  var rig = comp.layers.addNull(IC.DUR);
  rig.name = "RIG_LOGO";
  rig.threeDLayer = true;
  icTr(rig).property("ADBE Anchor Point").setValue([0, 0, 0]);
  icTr(rig).property("ADBE Position").setValue([IC.W / 2, IC.H / 2, 0]);

  icShow(comp, 0);
  icSave(log);
});
