/**
 * Lista de regalos de Nahia — la hoja "Lista" es el MAESTRO.
 *
 *   doGet   ->  { products:[...], reserved:{...}, contrib:{...} }
 *               (la web construye la lista de regalos con "products")
 *   doPost  ->  registra una reserva (fila en "Reservas (log)" + marca la fila en "Lista")
 *
 * PARA EDITAR LA LISTA, trabaja en la pestaña "Lista":
 *   · Quitar un regalo         -> borra su fila  (o pon "Visible en web" = No)
 *   · Cambiar precio/nombre/
 *     talla/foto/enlace/esencial-> edita esa celda
 *   · Marcar como reservado a
 *     mano                     -> rellena "Reservado por" + "Método de pago"
 *
 * NO cambies los títulos de las columnas ni los valores de la columna "ID".
 *
 * Tras pegar este archivo:  Implementar -> Gestionar implementaciones ->
 *   (lápiz) -> Versión: Nueva versión -> Implementar.
 */

var HOJA_LISTA = 'Lista';
var HOJA_LOG   = 'Reservas (log)';

/* normaliza texto para comparar cabeceras/categorías: minúsculas, sin acentos ni signos */
function norm(s){
  return String(s == null ? '' : s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/* "🛏 Sueño" / "Movilidad" ... -> clave que usa la web */
var CATMAP = {
  sueno: 'sueno', sueo: 'sueno',
  movilidad: 'movil',
  ropa: 'ropa',
  higiene: 'higiene',
  lactancia: 'lact',
  alimentacion: 'alim',
  juego: 'juego', entretenimiento: 'juego',
  salud: 'higiene'
};

function headerIndexer(sh){
  var hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(norm);
  return function(key){ return hdr.indexOf(key); };
}

function doGet(){
  var out = { products: [], reserved: {}, contrib: {} };
  var sh = SpreadsheetApp.getActive().getSheetByName(HOJA_LISTA);
  if (!sh || sh.getLastRow() < 2) return json(out);

  var ix = headerIndexer(sh);
  var I = {
    id:     ix('id'),
    cat:    ix('categoria'),
    n:      ix('producto'),
    pw:     ix('precioweb'),
    pn:     ix('precionum'),
    size:   ix('tallainfo'),
    ess:    ix('esencial'),
    estado: ix('estado'),
    quien:  ix('reservadopor'),
    metodo: ix('metododepago'),
    aport:  ix('aportado'),
    vis:    ix('visibleenweb'),
    foto:   ix('fotourl'),
    url:    ix('enlacedecompra')
  };
  var g = function(r, k){ return I[k] < 0 ? '' : r[I[k]]; };

  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  rows.forEach(function(r){
    var id = String(g(r, 'id')).trim();
    if (!id) return;

    var metodo = String(g(r, 'metodo')).trim();
    var quien  = String(g(r, 'quien')).trim();
    var aport  = Number(g(r, 'aport')) || 0;
    var estado = String(g(r, 'estado')).trim();
    var precio = Number(g(r, 'pn')) || 0;

    /* ---- estado de reserva (siempre, aunque el regalo esté oculto) ---- */
    if (metodo === 'Entre varios') {
      if (aport > 0) out.contrib[id] = aport;
      if (precio && aport >= precio) out.reserved[id] = { mode: 'group' };
    } else if (metodo || quien || estado.indexOf('RESERVADO') === 0) {
      out.reserved[id] = { mode: metodo === 'Bizum' ? 'bizum' : 'envio' };
    }

    /* ---- catálogo (solo si no está oculto) ---- */
    if (String(g(r, 'vis')).trim().toLowerCase() === 'no') return;
    var nombre = String(g(r, 'n')).trim();
    var precioTxt = String(g(r, 'pw')).trim();
    if (!nombre || (!precio && !precioTxt)) return;   // fila incompleta -> no se muestra

    var catN = norm(g(r, 'cat'));
    var p = {
      id: id,
      c: CATMAP[catN] || catN,
      n: nombre,
      p: precioTxt || (precio + ' €'),
      price: precio,
      url: String(g(r, 'url')).trim(),
      img: String(g(r, 'foto')).trim()
    };
    var sz = String(g(r, 'size')).trim();
    if (sz) p.size = sz;
    if (norm(g(r, 'ess')) === 'si') p.hi = true;
    if (metodo === 'Ya comprado') p.t = true;
    out.products.push(p);
  });

  return json(out);
}

function doPost(e){
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var pl = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActive();
    var sh = ss.getSheetByName(HOJA_LISTA);
    var log = ss.getSheetByName(HOJA_LOG);
    var ix = headerIndexer(sh);
    var cId = ix('id') + 1, cPn = ix('precionum') + 1,
        cQuien = ix('reservadopor') + 1, cMetodo = ix('metododepago') + 1,
        cAport = ix('aportado') + 1, cEstado = ix('estado') + 1;

    log.appendRow([
      new Date(), pl.id || '', pl.producto || '', pl.nombre || '',
      pl.metodo || '', pl.importe === 0 ? 0 : (pl.importe || ''),
      pl.postal || '', pl.mensaje || '', 'web'
    ]);

    var objetivos = [{ id: pl.id, extra: false }].concat(
      (pl.extras || []).map(function (x) { return { id: x.id, extra: true }; })
    );
    var data = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();

    objetivos.forEach(function (o) {
      for (var i = 0; i < data.length; i++) {
        if (String(data[i][cId - 1]).trim() !== String(o.id).trim()) continue;
        var fila = i + 2;
        var precio = Number(data[i][cPn - 1]) || 0;

        if (!o.extra && pl.metodo === 'Entre varios') {
          var acum = (Number(data[i][cAport - 1]) || 0) + (Number(pl.importe) || 0);
          var prev = String(data[i][cQuien - 1] || '').trim();
          sh.getRange(fila, cAport).setValue(acum);
          sh.getRange(fila, cMetodo).setValue('Entre varios');
          sh.getRange(fila, cQuien).setValue(prev ? prev + ', ' + pl.nombre : pl.nombre);
          if (precio && acum >= precio) sh.getRange(fila, cEstado).setValue('RESERVADO ✓');
        } else {
          sh.getRange(fila, cQuien).setValue(pl.nombre || '');
          sh.getRange(fila, cMetodo).setValue(
            o.extra && pl.metodo === 'Entre varios' ? 'Envío' : (pl.metodo || '')
          );
          sh.getRange(fila, cEstado).setValue('RESERVADO ✓');
        }
        break;
      }
    });

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function json(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
