/* Compartición de informes y exportaciones compatible con web y Capacitor Android. */
(function (root) {
  'use strict';
  function esNativo() {
    return !!(root.Capacitor && typeof root.Capacitor.isNativePlatform === 'function' && root.Capacitor.isNativePlatform());
  }
  function descargar(blob, nombre) {
    var url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download=nombre; a.style.display='none'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},2500);
    return {native:false,name:nombre};
  }
  function base64(blob) {
    return blob.arrayBuffer().then(function(buffer){
      var bytes=new Uint8Array(buffer), chunks=[], size=0x8000;
      for(var i=0;i<bytes.length;i+=size) chunks.push(String.fromCharCode.apply(null,bytes.subarray(i,Math.min(i+size,bytes.length))));
      return root.btoa(chunks.join(''));
    });
  }
  async function guardar(nombre, contenido, mime) {
    var blob=contenido instanceof Blob?contenido:new Blob([contenido],{type:mime||'application/octet-stream'});
    if(!esNativo()) return descargar(blob,nombre);
    var plugins=root.JEJNativePlugins||root.Capacitor&&root.Capacitor.Plugins||{}, fs=plugins.Filesystem, share=plugins.Share;
    if(!fs||!share) throw new Error('No están disponibles los servicios de archivos de Android. Sincroniza los plugins de Capacitor y vuelve a generar la APK.');
    var data=await base64(blob);
    var archivo=await fs.writeFile({path:nombre,data:data,directory:plugins.Directory&&plugins.Directory.Cache||'CACHE',recursive:true});
    await share.share({title:nombre,text:'Archivo generado por JeJ',files:[archivo.uri],dialogTitle:'Guardar o compartir archivo'});
    return {native:true,name:nombre,uri:archivo.uri};
  }
  function abrirInforme(html,titulo) {
    var anterior=document.getElementById('jej-informe-movil'); if(anterior) anterior.remove();
    var overlay=document.createElement('section');
    overlay.id='jej-informe-movil'; overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label',titulo||'Informe técnico');
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#eef2f7;display:flex;flex-direction:column;font-family:system-ui,Arial,sans-serif;color:#0f172a';
    var barra=document.createElement('header');
    barra.style.cssText='flex:0 0 auto;display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px max(12px,env(safe-area-inset-left)) 10px max(12px,env(safe-area-inset-right));background:#10265b;color:#fff;box-shadow:0 2px 8px #0003';
    var nombre=document.createElement('strong'); nombre.textContent=titulo||'Informe técnico';
    nombre.style.cssText='overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px';
    var acciones=document.createElement('div'); acciones.style.cssText='display:flex;gap:8px;flex:0 0 auto';
    var volver=document.createElement('button'); volver.type='button'; volver.textContent='‹ Volver a la app';
    volver.style.cssText='border:1px solid #9bb5eb;background:#1e3a72;color:#fff;border-radius:8px;padding:9px 12px;font-weight:700';
    var imprimir=document.createElement('button'); imprimir.type='button'; imprimir.textContent='Imprimir / PDF';
    imprimir.style.cssText='border:0;background:#18b775;color:#fff;border-radius:8px;padding:9px 12px;font-weight:700';
    acciones.appendChild(volver); acciones.appendChild(imprimir); barra.appendChild(nombre); barra.appendChild(acciones);
    var marco=document.createElement('iframe'); marco.title=titulo||'Informe técnico';
    marco.setAttribute('sandbox','allow-same-origin allow-scripts');
    marco.style.cssText='border:0;display:block;flex:1 1 auto;width:100%;min-height:0;background:#fff'; marco.srcdoc=html;
    overlay.appendChild(barra); overlay.appendChild(marco); document.body.appendChild(overlay);
    var oldOverflow=document.body.style.overflow; document.body.style.overflow='hidden';
    var open=true, pushed=false;
    try { root.history.pushState({jejInformeMovil:true},'',root.location.href); pushed=true; } catch(e) {}
    function remove(){if(!open)return;open=false;overlay.remove();document.body.style.overflow=oldOverflow;root.removeEventListener('popstate',pop);root.removeEventListener('keydown',key);}
    function pop(){remove();}
    function close(){if(!open)return;remove();if(pushed){try{root.history.back();}catch(e){}}}
    function key(e){if(e.key==='Escape')close();}
    volver.addEventListener('click',close);
    imprimir.addEventListener('click',function(){try{marco.contentWindow.focus();marco.contentWindow.print();}catch(e){root.alert('No se pudo abrir la impresión en este dispositivo. Puedes guardar el informe para imprimirlo después.');}});
    root.addEventListener('popstate',pop); root.addEventListener('keydown',key); volver.focus();
  }
  root.JEJArchivo={esNativo:esNativo,guardar:guardar,abrirInforme:abrirInforme};
})(window);