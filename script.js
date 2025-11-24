// ========================================================
// 1. ESTADO DA APLICAÇÃO (Variáveis Globais)
// ========================================================
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
let totalGlobal = 0;

// ========================================================
// 2. FUNÇÕES (O "Cérebro" do site)
// ========================================================

// teste

/**
 * Filtra os produtos na tela pela categoria
 */
function filterProducts(category) {
  const products = document.querySelectorAll('.product-grid .product');

  products.forEach(product => {
    if (category === 'all' || product.dataset.category === category) {
      product.classList.remove('hidden'); // MOSTRA
    } else {
      product.classList.add('hidden'); // ESCONDE
    }
  });
}

/**
 * Atualiza o HTML do carrinho com os itens da variável 'carrinho'
 */
function atualizarCarrinho(cartItemsEl, totalPriceEl) {
  if (!cartItemsEl) return;

  cartItemsEl.innerHTML = ''; 
  totalGlobal = 0; 

  carrinho.forEach((item, index) => {
    const li = document.createElement('li');
    li.textContent = `${item.nome} - R$ ${item.preco.toFixed(2)}`;
    
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'X';
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        removerItem(index, cartItemsEl, totalPriceEl); 
    });
    
    li.appendChild(removeBtn);
    cartItemsEl.appendChild(li);
    totalGlobal += item.preco; 
  });

  if (totalPriceEl) {
    totalPriceEl.textContent = `Total: R$ ${totalGlobal.toFixed(2)}`;
  }
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

/**
 * Adiciona um item ao carrinho e abre o modal
 */
function adicionarAoCarrinho(nome, preco, cartItemsEl, totalPriceEl, cartSectionEl) {
  carrinho.push({ nome, preco });
  atualizarCarrinho(cartItemsEl, totalPriceEl); 
  openCart(cartSectionEl); // Abre o carrinho ao adicionar
}

/**
 * Remove um item do carrinho pelo seu 'index' (posição)
 */
function removerItem(index, cartItemsEl, totalPriceEl) {
  carrinho.splice(index, 1);
  atualizarCarrinho(cartItemsEl, totalPriceEl);
}

/**
 * Adiciona os eventos de clique a TODOS os botões "add-to-cart"
 */
function configurarBotoes(cartItemsEl, totalPriceEl, cartSectionEl) {
  document.querySelectorAll('.add-to-cart').forEach(botao => {
    const newBotao = botao.cloneNode(true);
    botao.parentNode.replaceChild(newBotao, botao);

    newBotao.addEventListener('click', () => {
      const nome = newBotao.dataset.nome;
      const preco = parseFloat(newBotao.dataset.preco);
      
      if(nome && preco) {
        adicionarAoCarrinho(nome, preco, cartItemsEl, totalPriceEl, cartSectionEl);
      }
    });
  });
}

/**
 * Busca produtos do backend (onrender.com)
 */
async function carregarProdutos(cartItemsEl, totalPriceEl, cartSectionEl) {
  const container = document.getElementById('produtos-backend');
  if (!container) return; 

  try {
    const response = await fetch('https://charmane-backend.onrender.com/produtos');
    const produtos = await response.json();

    container.innerHTML = produtos.map(produto => `
      <div class="product" data-category="${produto.categoria}">
        <img src="${produto.imagem || 'https://via.placeholder.com/300x300'}" alt="${produto.nome}">
        <h2>${produto.nome}</h2>
        <p class="price">R$ ${produto.preco.toFixed(2)}</p>
        <button class="add-to-cart" data-nome="${produto.nome}" data-preco="${produto.preco}">Adicionar ao carrinho</button>
      </div>
    `).join('');

  } catch (erro) {
    console.error('Erro ao carregar produtos:', erro);
    container.innerHTML = "<p>Não foi possível carregar os produtos.</p>";
  } finally {
    configurarBotoes(cartItemsEl, totalPriceEl, cartSectionEl);
  }
}

/**
 * Função de Pagamento (Chama o backend)
 */
async function pagar(descricao, valor) {
  try {
    const resposta = await fetch("https://charmane-backend.onrender.com/api/pagamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao, valor }),
    });

    if (!resposta.ok) throw new Error('Falha ao gerar pagamento');
    const dados = await resposta.json();
    window.location.href = dados.url; // redireciona pro checkout
  } catch (erro) {
    console.error("Erro no pagamento:", erro);
    alert("Não foi possível iniciar o pagamento. Tente novamente.");
  }
}

/**
 * Abre o modal do carrinho
 */
function openCart(cartSectionEl) {
  if (cartSectionEl) {
    cartSectionEl.classList.add("open");
  }
}

/**
 * Fecha o modal do carrinho
 */
function closeCart(cartSectionEl) {
  if (cartSectionEl) {
    cartSectionEl.classList.remove("open");
  }
}

// ========================================================
// 3. INICIALIZAÇÃO (O "Start" do site)
// ========================================================
// SÓ RODA QUANDO O HTML ESTIVER 100% CARREGADO
document.addEventListener('DOMContentLoaded', () => {

  // 3.1. Seleciona TODOS os elementos que vamos usar
  const cartItemsEl = document.getElementById('cartItems');
  const totalPriceEl = document.getElementById('totalPrice');
  const themeToggleEl = document.getElementById('themeToggle');
  const cartIconEl = document.getElementById('cart-icon');
  const cartSectionEl = document.getElementById('cart');
  const closeCartBtnEl = document.getElementById('close-cart-btn'); // Botão 'X'
  const menuHamburgerEl = document.getElementById('menu-hamburger');
  const menuEl = document.querySelector('.menu');
  const checkoutBtnEl = document.getElementById('checkoutBtn');
  const filterLinks = document.querySelectorAll('.filter-link'); // Links de filtro

  // 3.2. Adiciona TODOS os 'escutadores' de clique

  // --- Lógica dos Filtros (A que você pediu) ---
  if (filterLinks && menuEl) {
    filterLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault(); 
        const category = e.target.dataset.filter; 
        
        filterProducts(category); // Roda a função de filtrar

        // (Bônus) Fecha o menu hambúrguer se estiver no celular
        if (menuEl.classList.contains('open')) {
          menuEl.classList.remove('open');
        }
      });
    });
  }
  
  // --- Lógica do Menu Hambúrguer ---
  if (menuHamburgerEl && menuEl) {
    menuHamburgerEl.addEventListener('click', (e) => {
      e.preventDefault(); 
      menuEl.classList.toggle('open');
    });
  }

  // --- Lógica de Abrir o Carrinho (Ícone) ---
  if (cartIconEl && cartSectionEl) {
    cartIconEl.addEventListener('click', (e) => {
      e.preventDefault();
      openCart(cartSectionEl); // Usa a função unificada
    });
  }

  // --- Lógica de Fechar o Carrinho (Botão 'X') ---
  if (closeCartBtnEl && cartSectionEl) {
    closeCartBtnEl.addEventListener('click', () => {
      closeCart(cartSectionEl); // Usa a função unificada
    });
  }

  // --- Lógica de Checkout (Botão) ---
  if (checkoutBtnEl) {
    checkoutBtnEl.addEventListener('click', () => {
      if (carrinho.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
      }
      pagar("Compra em CHARMANE VÊTEMENTS", totalGlobal);
    });
  }

  // --- Lógica do Modo Escuro ---
  if (themeToggleEl) {
    themeToggleEl.addEventListener('click', () => {
      const html = document.documentElement;
      html.dataset.theme = html.dataset.theme === 'light' ? 'dark' : 'light';
      themeToggleEl.textContent = html.dataset.theme === 'light' ? '🌙' : '☀️';
    });
  }
  
  // 3.3. Roda as funções de inicialização
  
  // 1º Mostra o carrinho que já estava salvo
  atualizarCarrinho(cartItemsEl, totalPriceEl); 
  
  // 2º ATIVA OS BOTÕES FIXOS (Rápido)
  configurarBotoes(cartItemsEl, totalPriceEl, cartSectionEl); 
  
  // 3º Busca os produtos do backend (Lento, vai re-configurar os botões depois)
  carregarProdutos(cartItemsEl, totalPriceEl, cartSectionEl); 

});