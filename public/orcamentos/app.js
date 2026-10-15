(() => {
  const DRAFT_KEY = "gataria-orcamento-painel-v1";
  let cloudId = new URLSearchParams(location.search).get("id"), cloudRevision = null, orderId = null, cloudBusy = false;
  const DEFAULT_LOGO = "assets/gataria-rock-logo.png";
  const brandLogo = (value) => !value || value === "assets/gataria-logo.png" ? DEFAULT_LOGO : value;
  const form = document.querySelector("#quoteForm");
  const productsList = document.querySelector("#productsList");
  const toast = document.querySelector("#toast");
  let logoData = DEFAULT_LOGO;
  let artData = "";
  let nextProductId = 2;

  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const $ = (id) => document.getElementById(id);
  const val = (id) => ($(id)?.value || "").trim();
  const num = (id) => Math.max(0, Number($(id)?.value) || 0);
  const text = (id, value) => { if ($(id)) $(id).textContent = value; };
  const setValue = (id, value) => { if ($(id) && value !== undefined && value !== null) $(id).value = value; };
  const capitalize = (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);

  function newProduct(overrides = {}) {
    const first = products.length === 0;
    return {
      id: overrides.id || nextProductId++,
      label: overrides.label ?? (first ? "Camiseta personalizada" : `Produto ${products.length + 1}`),
      productType: overrides.productType || "Camiseta tradicional",
      shirtColor: overrides.shirtColor ?? "Preta",
      fabric: overrides.fabric ?? "100% algodão",
      sleeve: overrides.sleeve || "Curta",
      printMethod: overrides.printMethod ?? "Impressão DTF e prensagem individual",
      frontDescription: overrides.frontDescription ?? "Arte colorida personalizada.",
      backDescription: overrides.backDescription ?? "Sem estampa nas costas.",
      sizes: { P: 0, M: 0, G: 0, GG: 0, G1: 0, ...(overrides.sizes || {}) },
      regularPrice: Number(overrides.regularPrice ?? 0),
      g1Price: Number(overrides.g1Price ?? 0)
    };
  }

  let products = [];
  products.push(newProduct({
    label: "Camiseta personalizada",
    sizes: { P: 0, M: 0, G: 0, GG: 0, G1: 0 },
    regularPrice: 48.90,
    g1Price: 67.50,
    frontDescription: "Arte colorida personalizada.",
    backDescription: "Sem estampa nas costas."
  }));

  function productNames(type) {
    const catalog = {
      "Camiseta tradicional": ["camiseta tradicional", "camisetas tradicionais"],
      "Camisa polo": ["camisa polo", "camisas polo"],
      "Baby look": ["baby look", "baby looks"],
      "Regata": ["regata", "regatas"],
      "Outro produto": ["produto personalizado", "produtos personalizados"]
    };
    const names = catalog[type] || catalog["Outro produto"];
    return { singular: names[0], plural: names[1] };
  }

  function localDate() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function quoteNumber(dateValue) {
    const date = dateValue ? new Date(`${dateValue}T12:00:00`) : new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `GAT ${year} ${month}${day} ${crypto.randomUUID().slice(0,6).toUpperCase()}`;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function staticStateFromForm() {
    const fields = [...form.querySelectorAll("input:not([type=file]):not([data-product-field]), textarea:not([data-product-field]), select:not([data-product-field])")];
    return Object.fromEntries(fields.map((field) => [field.id, field.value]));
  }

  function saveDraft(silent = false) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ fields: staticStateFromForm(), products, logoData, artData }));
      if (!silent) showToast("Rascunho salvo neste navegador.");
    } catch {
      if (!silent) showToast("Não foi possível salvar o rascunho.");
    }
  }

  function applyFields(fields = {}) {
    Object.entries(fields).forEach(([id, value]) => setValue(id, value));
  }

  function loadDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
      if (draft?.fields && Array.isArray(draft.products) && draft.products.length) {
        applyFields(draft.fields);
        products = draft.products.map((product) => newProduct(product));
        nextProductId = Math.max(...products.map((product) => Number(product.id) || 0), 1) + 1;
        logoData = brandLogo(draft.logoData);
        artData = draft.artData || "";
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  function renderProducts() {
    productsList.innerHTML = products.map((product, index) => `
      <article class="product-card" data-product-id="${product.id}">
        <div class="product-card-header">
          <div><span>PRODUTO ${index + 1}</span><strong>${escapeHtml(product.label || product.productType)}</strong></div>
          <button class="remove-product-button" type="button" data-remove-product="${product.id}" ${products.length === 1 ? "disabled" : ""}>Remover</button>
        </div>
        <div class="product-card-body">
          <div class="field full"><label>Nome deste produto</label><input data-product-field="label" value="${escapeHtml(product.label)}" placeholder="Ex.: Camiseta preta — arte gato" /></div>
          <div class="field-grid two">
            <div class="field"><label>Produto</label><select data-product-field="productType">
              ${["Camiseta tradicional", "Camisa polo", "Baby look", "Regata", "Outro produto"].map((option) => `<option value="${option}" ${option === product.productType ? "selected" : ""}>${option}</option>`).join("")}
            </select></div>
            <div class="field"><label>Cor</label><input data-product-field="shirtColor" value="${escapeHtml(product.shirtColor)}" /></div>
          </div>
          <div class="field-grid two">
            <div class="field"><label>Tecido ou material</label><input data-product-field="fabric" value="${escapeHtml(product.fabric)}" /></div>
            <div class="field"><label>Manga</label><select data-product-field="sleeve">
              ${["Curta", "Longa", "Sem manga"].map((option) => `<option value="${option}" ${option === product.sleeve ? "selected" : ""}>${option}</option>`).join("")}
            </select></div>
          </div>
          <div class="field full"><label>Processo de personalização</label><input data-product-field="printMethod" value="${escapeHtml(product.printMethod)}" /></div>
          <div class="field-grid sizes" role="group" aria-label="Quantidade por tamanho do produto ${index + 1}">
            ${["P", "M", "G", "GG", "G1"].map((size) => `<div class="field compact ${size === "G1" ? "accent" : ""}"><label>${size}</label><input data-product-field="size.${size}" type="number" min="0" value="${Number(product.sizes[size]) || 0}" /></div>`).join("")}
          </div>
          <div class="field-grid two">
            <div class="field money"><label>Valor P ao GG</label><div class="input-prefix"><span>R$</span><input data-product-field="regularPrice" type="text" inputmode="decimal" value="${Number(product.regularPrice) || 0}" /></div></div>
            <div class="field money"><label>Valor G1/XG</label><div class="input-prefix"><span>R$</span><input data-product-field="g1Price" type="text" inputmode="decimal" value="${Number(product.g1Price) || 0}" /></div></div>
          </div>
          <div class="field full"><label>Estampa da frente</label><textarea data-product-field="frontDescription" rows="2">${escapeHtml(product.frontDescription)}</textarea></div>
          <div class="field full"><label>Estampa das costas</label><textarea data-product-field="backDescription" rows="2">${escapeHtml(product.backDescription)}</textarea></div>
          <div class="product-subtotal"><span>Subtotal deste produto</span><strong data-product-subtotal="${product.id}">R$ 0,00</strong></div>
        </div>
      </article>
    `).join("");
  }

  function productCalculation(product) {
    const sizes = Object.fromEntries(["P", "M", "G", "GG", "G1"].map((size) => [size, Math.max(0, Number(product.sizes[size]) || 0)]));
    const regularQuantity = sizes.P + sizes.M + sizes.G + sizes.GG;
    const g1Quantity = sizes.G1;
    const totalQuantity = regularQuantity + g1Quantity;
    const regularPrice = Math.max(0, Number(product.regularPrice) || 0);
    const g1Price = Math.max(0, Number(product.g1Price) || 0);
    const regularSubtotal = regularQuantity * regularPrice;
    const g1Subtotal = g1Quantity * g1Price;
    return { ...product, sizes, regularQuantity, g1Quantity, totalQuantity, regularPrice, g1Price, regularSubtotal, g1Subtotal, subtotal: regularSubtotal + g1Subtotal };
  }

  function currentData() {
    const calculatedProducts = products.map(productCalculation);
    const totalQuantity = calculatedProducts.reduce((sum, product) => sum + product.totalQuantity, 0);
    const total = calculatedProducts.reduce((sum, product) => sum + product.subtotal, 0);
    const deposit = Math.min(100, num("deposit"));
    const depositAmount = total * deposit / 100;
    return { products: calculatedProducts, totalQuantity, total, deposit, depositAmount, balanceAmount: total - depositAmount };
  }

  function updatePreview() {
    const data = currentData();
    const targetQuantity = num("targetQuantity");
    const client = val("clientName") || "Cliente não informado";
    const brand = val("brandName") || "GATARIA";
    const issue = val("issueDate") ? new Date(`${val("issueDate")}T12:00:00`) : new Date();

    text("sheetBrandName", brand.toUpperCase());
    text("sheetBrandSubtitle", val("brandSubtitle"));
    text("sheetClientHeadline", client);
    text("sheetClient", client);
    text("sheetDate", dateFormat.format(issue));
    text("sheetNumber", val("quoteNumber") || quoteNumber(val("issueDate")));
    text("sheetValidity", `${Math.max(1, num("validity"))} dias corridos`);
    const details = val("clientDetails");
    $("sheetClientDetails").hidden = !details;
    text("sheetClientDetails", details);

    text("sheetTitle", data.products.length > 1 ? "Orçamento de produtos personalizados" : `Orçamento de ${productNames(data.products[0].productType).plural} personalizadas`);
    text("sheetIntro", `Este orçamento contempla ${data.totalQuantity} peças distribuídas em ${data.products.length} ${data.products.length === 1 ? "produto" : "produtos"}, conforme a grade e as especificações abaixo.`);

    $("sheetProductScopes").innerHTML = data.products.map((product, index) => {
      const names = productNames(product.productType);
      const grade = Object.entries(product.sizes).filter(([, qty]) => qty > 0).map(([size, qty]) => `${size}: ${qty}`).join(" | ") || "sem quantidades";
      return `<div class="product-scope"><strong>${index + 1}. ${escapeHtml(product.label || capitalize(names.singular))}</strong><span>${product.totalQuantity} peças • ${escapeHtml(grade)}</span><small>${escapeHtml(capitalize(names.singular))}, cor ${escapeHtml(product.shirtColor.toLowerCase() || "não informada")}, ${escapeHtml(product.fabric || "material não informado")}, manga ${escapeHtml(product.sleeve.toLowerCase())}. Frente: ${escapeHtml(product.frontDescription || "não informada")}. Costas: ${escapeHtml(product.backDescription || "não informada")}. Processo: ${escapeHtml(product.printMethod || "não informado")}.</small></div>`;
    }).join("");

    const rows = [];
    data.products.forEach((product) => {
      const base = escapeHtml(product.label || product.productType);
      if (product.regularQuantity > 0) rows.push(`<tr><td>${base} — P ao GG</td><td>${product.regularQuantity}</td><td>${money.format(product.regularPrice)}</td><td>${money.format(product.regularSubtotal)}</td></tr>`);
      if (product.g1Quantity > 0) rows.push(`<tr><td>${base} — G1/XG</td><td>${product.g1Quantity}</td><td>${money.format(product.g1Price)}</td><td>${money.format(product.g1Subtotal)}</td></tr>`);
    });
    $("investmentRows").innerHTML = rows.length ? rows.join("") : `<tr><td colspan="4">Informe as quantidades dos produtos.</td></tr>`;
    text("sheetTotal", money.format(data.total));
    text("previewTotal", money.format(data.total));

    data.products.forEach((product) => {
      const subtotal = document.querySelector(`[data-product-subtotal="${product.id}"]`);
      if (subtotal) subtotal.textContent = money.format(product.subtotal);
    });

    const remaining = 100 - data.deposit;
    text("sheetPayment", `${data.deposit}% na confirmação e ${remaining}% na entrega.`);
    text("sheetDepositLabel", `Entrada (${data.deposit}%)`);
    text("sheetDepositAmount", money.format(data.depositAmount));
    text("sheetBalanceLabel", `Saldo na entrega (${remaining}%)`);
    text("sheetBalanceAmount", money.format(data.balanceAmount));
    text("sheetStart", `${val("productionStart") || "A definir"}.`);
    text("sheetDelivery", `${val("delivery") || "A definir"}.`);
    const notes = val("notes");
    $("sheetNotesLine").hidden = !notes;
    text("sheetNotes", notes);
    text("signatureBrand", brand);
    text("signatureClient", client);
    text("footerBrand", brand.toUpperCase());
    text("footerContact", val("brandContact") || "Orçamento comercial");
    $("sheetLogo").src = logoData;
    $("selectedArtBlock").hidden = !artData;
    if (artData) $("sheetArt").src = artData;

    const status = $("quantityStatus");
    status.className = "quantity-status";
    if (targetQuantity === 0) {
      status.innerHTML = `<span>Total preenchido em ${data.products.length} ${data.products.length === 1 ? "produto" : "produtos"}</span><strong>${data.totalQuantity} peças</strong>`;
    } else if (data.totalQuantity === targetQuantity) {
      status.classList.add("ok");
      status.innerHTML = `<span>Pedido fechado em ${data.products.length} ${data.products.length === 1 ? "produto" : "produtos"}</span><strong>${targetQuantity} peças</strong>`;
    } else {
      status.classList.add("warn");
      const difference = targetQuantity - data.totalQuantity;
      status.innerHTML = difference > 0 ? `<span>Faltam ${difference} para chegar em ${targetQuantity}</span><strong>${data.totalQuantity} peças</strong>` : `<span>Passou ${Math.abs(difference)} de ${targetQuantity}</span><strong>${data.totalQuantity} peças</strong>`;
    }
  }

  function updateProductFromInput(input) {
    const card = input.closest("[data-product-id]");
    if (!card) return;
    const product = products.find((item) => String(item.id) === card.dataset.productId);
    if (!product) return;
    const field = input.dataset.productField;
    if (field.startsWith("size.")) product.sizes[field.split(".")[1]] = Math.max(0, Number(input.value) || 0);
    else if (["regularPrice", "g1Price"].includes(field)) product[field] = Math.max(0, Number(input.value.replace(",", ".")) || 0);
    else product[field] = input.value;
    const header = card.querySelector(".product-card-header strong");
    if (header && field === "label") header.textContent = input.value || product.productType;
  }

  function addProduct() {
    products.push(newProduct());
    renderProducts();
    updatePreview();
    saveDraft(true);
    productsList.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    showToast("Novo produto adicionado.");
  }

  function removeProduct(id) {
    if (products.length === 1) return;
    products = products.filter((product) => String(product.id) !== String(id));
    renderProducts();
    updatePreview();
    saveDraft(true);
    showToast("Produto removido.");
  }

  function resetForm() {
    if (!confirm("Iniciar um novo orçamento? Salve o atual antes de continuar.")) return;
    cloudId=null; cloudRevision=null; orderId=null; history.replaceState(null,"",location.pathname);
    $("cloudStatus").textContent="Novo orçamento. Clique em Salvar orçamento para guardar no painel.";
    localStorage.removeItem(DRAFT_KEY);
    form.reset();
    products = [];
    nextProductId = 2;
    products.push(newProduct({ id: 1, label: "Camiseta personalizada", productType: "Camiseta tradicional", shirtColor: "Preta", fabric: "100% algodão", sleeve: "Curta", printMethod: "Impressão DTF e prensagem individual", frontDescription: "Arte colorida personalizada.", backDescription: "Sem estampa nas costas.", regularPrice: 48.90, g1Price: 67.50 }));
    setValue("issueDate", localDate());
    setValue("quoteNumber", quoteNumber(val("issueDate")));
    logoData = DEFAULT_LOGO;
    artData = "";
    $("artUpload").value = "";
    renderProducts();
    updatePreview();
    showToast("Novo orçamento iniciado.");
  }

  async function requestCloud(body) {
    const response = await fetch('/api/quotes', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const data = await response.json(); if(!response.ok) throw Error(data.error || 'Não foi possível salvar.'); return data;
  }
  async function saveCloud() {
    if(orderId) throw Error('Este orçamento já virou pedido. Edite o pedido no painel ou inicie um novo orçamento.');
    const payload={fields:staticStateFromForm(),products,logoData,artData};
    const result=await requestCloud({action:'save',id:cloudId,revision:cloudRevision,payload});
    cloudId=result.id;cloudRevision=result.revision;
    history.replaceState(null,'',location.pathname+'?id='+encodeURIComponent(cloudId));
    $('cloudStatus').textContent='Orçamento salvo no painel. Você pode imprimir o PDF ou aprovar para criar o pedido.';
    window.parent.postMessage({type:'gataria-quotes-updated'},location.origin);return result;
  }
  async function cloudAction(convert) {
    if(cloudBusy)return; cloudBusy=true;
    $('saveCloud').disabled=true;$('convertOrder').disabled=true;
    try {
      if(convert&&orderId){ window.parent.postMessage({type:'gataria-order-created',orderId},location.origin);return; }
      await saveCloud();
      if(convert){
        if(!confirm('Aprovar este orçamento e criar um pedido? O pagamento será registrado separadamente, quando recebido.'))return;
        const result=await requestCloud({action:'convert',id:cloudId,revision:cloudRevision});orderId=result.orderId;
        $('cloudStatus').textContent='Pedido criado. Registre o sinal recebido no pedido.';
        window.parent.postMessage({type:'gataria-order-created',orderId},location.origin);
      }else showToast('Orçamento salvo no painel.');
    }catch(e){$('cloudStatus').textContent=e.message;showToast(e.message);}
    finally{cloudBusy=false;$('saveCloud').disabled=false;$('convertOrder').disabled=false;}
  }
  async function loadCloud() {
    if(!cloudId)return;
    $('saveCloud').disabled=true;$('convertOrder').disabled=true;
    try{
      const response=await fetch('/api/quotes?id='+encodeURIComponent(cloudId));const q=await response.json();if(!response.ok)throw Error(q.error);
      cloudRevision=q.revision;orderId=q.order_id;const p=q.payload;applyFields(p.fields);products=p.products.map(newProduct);nextProductId=Math.max(...products.map(p=>Number(p.id)||0))+1;logoData=brandLogo(p.logoData);artData=p.artData||'';renderProducts();updatePreview();
      $('cloudStatus').textContent=orderId?'Este orçamento já foi convertido. Use o painel para alterar o pedido ou Novo para outra proposta.':'Orçamento salvo carregado. As alterações só são enviadas ao painel ao clicar em Salvar orçamento.';
      if(orderId)$('convertOrder').textContent='Abrir pedido';
    }catch(e){$('cloudStatus').textContent=e.message;cloudId=null;}
    finally{$('saveCloud').disabled=false;$('convertOrder').disabled=false;}
  }
  $('saveCloud').addEventListener('click',()=>cloudAction(false));
  $('convertOrder').addEventListener('click',()=>cloudAction(true));

  function printQuote() {
    updatePreview();
    window.setTimeout(() => window.print(), 60);
  }

  function bindSections() {
    document.querySelectorAll(".section-toggle").forEach((button) => button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      button.nextElementSibling.hidden = expanded;
      button.querySelector("i").textContent = expanded ? "+" : "−";
    }));
  }

  function bindLogoUpload() {
    $("logoUpload").addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { showToast("Escolha uma imagem de até 2 MB."); event.target.value = ""; return; }
      const reader = new FileReader();
      reader.onload = () => { logoData = String(reader.result); updatePreview(); saveDraft(true); showToast("Logo atualizado."); };
      reader.readAsDataURL(file);
    });
  }

  function prepareArtPreview(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const image = new Image();
        image.onerror = reject;
        image.onload = () => {
          const maxDimension = 1600;
          const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/webp", .9));
        };
        image.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  function bindArtUpload() {
    $("artUpload").addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 15 * 1024 * 1024) { showToast("Escolha uma imagem de até 15 MB."); event.target.value = ""; return; }
      try { artData = await prepareArtPreview(file); updatePreview(); saveDraft(true); showToast("Arte adicionada ao orçamento."); }
      catch { event.target.value = ""; showToast("Não foi possível abrir essa imagem."); }
    });
    $("removeArt").addEventListener("click", () => { artData = ""; $("artUpload").value = ""; updatePreview(); saveDraft(true); showToast("Imagem da arte removida."); });
  }

  function registerWebMcp() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    Promise.resolve(context.registerTool({
      name: "get_quote_summary",
      title: "Consultar orçamento atual",
      description: "Retorna cliente, produtos, quantidades, preços e total do orçamento visível.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute() {
        const data = currentData();
        return { client: val("clientName"), quoteNumber: val("quoteNumber"), products: data.products, totalQuantity: data.totalQuantity, total: data.total, depositPercent: data.deposit, depositAmount: data.depositAmount, balanceAmount: data.balanceAmount };
      }
    }, { signal: lifecycle.signal })).catch(() => {});
    window.addEventListener("beforeunload", () => lifecycle.abort(), { once: true });
  }

  form.addEventListener("input", (event) => {
    if (event.target.dataset.productField) updateProductFromInput(event.target);
    updatePreview();
    saveDraft(true);
  });
  form.addEventListener("change", (event) => {
    if (event.target.dataset.productField) updateProductFromInput(event.target);
    updatePreview();
    saveDraft(true);
  });
  productsList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-product]");
    if (button) removeProduct(button.dataset.removeProduct);
  });
  $("addProduct").addEventListener("click", addProduct);
  $("issueDate").addEventListener("change", () => {
    if (!val("quoteNumber") || /^GAT \d{4} \d{4} 01$/.test(val("quoteNumber"))) setValue("quoteNumber", quoteNumber(val("issueDate")));
    updatePreview();
  });
  $("newQuote").addEventListener("click", resetForm);
  $("saveDraft").addEventListener("click", () => saveDraft(false));
  $("printQuote").addEventListener("click", printQuote);
  $("printQuoteMobile").addEventListener("click", printQuote);

  bindSections();
  bindLogoUpload();
  bindArtUpload();
  if (cloudId || !loadDraft()) {
    setValue("issueDate", localDate());
    setValue("quoteNumber", quoteNumber(val("issueDate")));
  }
  renderProducts();
  updatePreview();
  registerWebMcp();
  loadCloud();
})();
