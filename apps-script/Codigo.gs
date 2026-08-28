/**
 * Lista de regalos de Nahia — puente web ↔ Google Sheet.
 *
 * Pega este archivo en:  Hoja de Google → Extensiones → Apps Script  (borra lo que haya).
 * Luego:  Implementar → Nueva implementación → Aplicación web
 *         · Ejecutar como: Yo
 *         · Quién tiene acceso: Cualquier persona
 *         Copia la URL que termina en /exec y pégala en lista-nahia.html (SHEET_URL).
 *
 * Hoja "Lista"  (columnas):
 *   1 ID · 5 Precio web · 6 Precio (núm.) · 9 Estado ·
 *   10 Reservado por · 11 Método de pago · 12 Aportado (€) · 13 Visible en web
 * Hoja "Reservas (log)": una fila por reserva (registro).
 */

var HOJA_LISTA = 'Lista';
var HOJA_LOG   = 'Reservas (log)';
var COL = { id: 1, precio: 6, estado: 9, quien: 10, metodo: 11, aportado: 12, visible: 13 };
var ANCHO = 13; // nº de columnas que leemos de la hoja "Lista"

/**
 * La web pide el estado actual: { reserved:{id:{mode}}, contrib:{id:€} }
 * IMPORTANTE: aquí NO se devuelven nombres. Los invitados solo ven que algo
 * está cogido; el nombre de quien reserva queda solo en la hoja (privada),
 * en el log y en el mensaje de WhatsApp que os llega.
 */
function doGet() {
  var out = { reserved: {}, contrib: {} };
  var sh = SpreadsheetApp.getActive().getSheetByName(HOJA_LISTA);
  if (sh && sh.getLastRow() > 1) {
    var data = sh.getRange(2, 1, sh.getLastRow() - 1, ANCHO).getValues();
    data.forEach(function (row) {
      var id = String(row[COL.id - 1] || '').trim();
      if (!id) return;
      var precio = Number(row[COL.precio - 1]) || 0;
      var quien  = String(row[COL.quien - 1] || '').trim();
      var metodo = String(row[COL.metodo - 1] || '').trim();
      var aport  = Number(row[COL.aportado - 1]) || 0;
      var estado = String(row[COL.estado - 1] || '').trim();

      if (metodo === 'Entre varios') {
        if (aport > 0) out.contrib[id] = aport;                 // solo el importe, sin nombres
        if (precio && aport >= precio) out.reserved[id] = { mode: 'group' };
      } else if (quien || metodo || estado.indexOf('RESERVADO') === 0) {
        out.reserved[id] = { mode: metodo === 'Bizum' ? 'bizum' : 'envio' };  // sin 'giver'
      }
    });
  }
  return json(out);
}

/** La web comunica una reserva nueva. */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var p = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActive();
    var sh = ss.getSheetByName(HOJA_LISTA);
    var log = ss.getSheetByName(HOJA_LOG);

    // 1) registro en "Reservas (log)"
    log.appendRow([
      new Date(), p.id || '', p.producto || '', p.nombre || '',
      p.metodo || '', p.importe === 0 ? 0 : (p.importe || ''),
      p.postal || '', p.mensaje || '', 'web'
    ]);

    // 2) actualizar "Lista": producto principal + posibles extras del mismo envío
    var objetivos = [{ id: p.id, extra: false }].concat(
      (p.extras || []).map(function (x) { return { id: x.id, extra: true }; })
    );
    var data = sh.getRange(2, 1, sh.getLastRow() - 1, ANCHO).getValues();

    objetivos.forEach(function (obj) {
      for (var r = 0; r < data.length; r++) {
        if (String(data[r][COL.id - 1]).trim() !== String(obj.id).trim()) continue;
        var fila = r + 2;
        var precio = Number(data[r][COL.precio - 1]) || 0;
        var grupo = !obj.extra && p.metodo === 'Entre varios';

        if (grupo) {
          var acum = (Number(data[r][COL.aportado - 1]) || 0) + (Number(p.importe) || 0);
          var previos = String(data[r][COL.quien - 1] || '').trim();
          sh.getRange(fila, COL.aportado).setValue(acum);
          sh.getRange(fila, COL.metodo).setValue('Entre varios');
          sh.getRange(fila, COL.quien).setValue(previos ? previos + ', ' + p.nombre : p.nombre);
          if (precio && acum >= precio) sh.getRange(fila, COL.estado).setValue('RESERVADO ✓');
        } else {
          sh.getRange(fila, COL.quien).setValue(p.nombre || '');
          sh.getRange(fila, COL.metodo).setValue(
            obj.extra && p.metodo === 'Entre varios' ? 'Envío' : (p.metodo || '')
          );
          sh.getRange(fila, COL.estado).setValue('RESERVADO ✓');
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

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
