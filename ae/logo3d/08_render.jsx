// PASSO 8: salva e renderiza LOGO_MASTER pelo Render Queue do próprio AE (o progresso aparece no app):
// sequência PNG, RGB + Alfa, STRAIGHT (sem matte), 16 bits -> ae/logo3d/<CFG.RENDER16>/logo16_00000.png ...
// Módulo de saída: o template PNG interno "_HIDDEN X-Factor 16" (PNG Sequence, RGB+Alpha, Straight,
// Trillions of Colors+); "Format" é só leitura via setSettings.
// Por que 16 bits: a saída de 8 bits do AE põe ruído de dither por quadro (+-1 nível), então a cauda parada
// não ficaria idêntica quadro a quadro. Depois, png16to8.py quantiza para 8 bits com arredondamento simples.
var LOGO3D_DIR = File($.fileName).parent.fsName;
$.evalFile(new File(LOGO3D_DIR + "/lib.jsxinc"));

icRun("08_render", function (log) {
  var comp = icItem(IC.MASTER);
  if (!comp) throw new Error("LOGO_MASTER não existe; rode 07_master.jsx");
  icShow(comp, 0);

  // Limpa a pasta antes, para o AE nunca ter uma pergunta de sobrescrever.
  var out = new Folder(IC.RENDER16);
  if (!out.exists) out.create();
  var old = out.getFiles("*.png");
  for (var i = 0; i < old.length; i++) old[i].remove();
  log("apagados " + old.length + " png antigos");

  var rq = app.project.renderQueue;
  while (rq.numItems > 0) rq.item(1).remove();
  var rqi = rq.items.add(comp);

  var rsT = rqi.templates;
  for (var t = 0; t < rsT.length; t++) if (/^(Melhores configura|Best Settings)/.test(rsT[t])) { rqi.applyTemplate(rsT[t]); log("template de render " + rsT[t]); break; }
  try { rqi.setSettings({ "Guide Layers": "All Off" }); } catch (e1) { log("guide layers: " + e1.message); }
  try { rqi.setSettings({ "Time Span": "Length of Comp" }); } catch (e2) { log("time span: " + e2.message); }

  var om = rqi.outputModule(1);
  om.applyTemplate("_HIDDEN X-Factor 16");
  om.file = new File(IC.RENDER16 + "/logo16_[#####].png");
  var os = om.getSettings(GetSettingsFormat.STRING);
  log("saída Format=" + os["Format"] + " Channels=" + os["Channels"] + " Color=" + os["Color"] + " Depth=" + os["Depth"]);
  if (os["Format"] !== "PNG Sequence" || os["Channels"] !== "RGB + Alpha") throw new Error("o módulo de saída não é PNG RGB+Alpha");

  icSave(log);
  var t0 = new Date().getTime();
  rq.render();   // síncrono; o painel Render Queue mostra o progresso
  log("render status " + rqi.status + " em " + ((new Date().getTime() - t0) / 1000).toFixed(1) + " s");
  log("quadros 16 bits: " + out.getFiles("logo16_*.png").length);
  icSave(log);
});
