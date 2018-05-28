var app = {
  cards: [], //notre array pour stocker les cartes pour mélange
  lgside: $(window).width()<$(window).height()? 'vh' : 'vw',
  rows: 4, //valeur par défaut, normalement ne change pas
  columns: 7, //valeur par défaut, change selon level difficulté
  nbCards: 0, //sera calculé par rows*columns
  position: 0, //position du bg-position qui passera à 0 avec la 1ere carte générée
  score: 0, //+1 pour chaque paire découverte
  phase: false, //toggler pour savoir à quelle phase du jeu on est (1ere carte ou 2eme carte retournée)
  lastPosition: 0, //permet de savoir quelle carte a été retournée en dernier
  maxTimer: 60000, //Timer par défaut, change selon difficulté
  currentTimer: 0, //Notre temps de jeu actuel
  chrono: false, //la variable pour le setInterval
  level: 'mario', //la difficulté par défaut (avec toad et bowser)
  combo: 0, //le compteur de combo
  bestcombo: 0, //pour stocker notre meilleur combo dans le but de l'afficher dans les highScores


  init: function() {

    console.log('Init');
    app.generateHighScores(); //on construit le tableau des highScores et on l'affiche
    $('.mode').on('click', app.setConfig); //on écoute les boutons de sélection de difficulté et on lance la config du jeu



  },
  //Récupèration des datas dans les boutons de difficulté avant de lancer la partie avec les bons paramètres
  setConfig(event) {
    event.preventDefault();
    app.maxTimer = $(this).data('maxtimer');
    app.columns = $(this).data('columns');
    app.level = $(this).text();
    app.startGame();
  },

  //Lance le launcher qui construit les éléments de la partie, puis écoute sur les cartes et lance le chrono
  startGame() {
    app.launcher();
    $('.carte').on('click', app.clickCard);
    app.chrono = setInterval(app.timeManagement, 100);
  },

  //Remet le DOM et les propriétés à zéro et reconstruit le tout avec les bons paramètres pour une nouvelle partie
  launcher() {
    $('#plateau').remove(); //on efface le plateau et les cartes dedans
    clearInterval(app.chrono); //on efface le précédent chrono
    app.currentTimer = 0; // on remet le temps de la partie à zéro
    $('#timer').attr('max', app.maxTimer); //on alimente l'élément html progress avec les bonnes valeurs
    $('#timer').attr('value', 0);
    $('#gameMessages').text('Here comes a new challenger!!!'); //on vide le contenu de la div des messages du jeu
    $('.box').detach().removeClass('explosive').appendTo($('#main')); //on enlève le statut "explosif" des divs concernées
    //(note: obligé de detach et appendTo pour éviter des problèmes avec l'animation au retour sur l'écran de jeu)
    app.cards = []; //on vide le tableau de cartes (sinon elles s'accumulent dedans à chaque nouvelle partie)
    app.position = 0;
    app.lastPosition = 0;
    app.score = 0;
    app.phase = false;
    app.combo = 0;
    app.bestCombo = 0;
    app.nbCards = app.rows * app.columns; //on calcule le nombre de cartes à générer
    app.createBoard(app.rows, app.columns); //on crée le plateau
    app.createCards(app.nbCards); //on crée les cartes
    app.shuffleCards(app.cards); // on les mélange
    app.addCardsToBoard(app.cards); // on les ajoute au plateau
    $('#cancel').on('click', app.cancelGame); //on écoute le bouton cancel et on lance la fonction correspondante
    $('#startMenu').hide(); //on cache l'écran Menu pour accéder à l'écran de jeu
  },

  //Création du plateau aux dimensions voulues et on l'ajoute à #main au début
  createBoard(rows, columns) {
    app.lgside = $(window).width()<$(window).height()? 'vh' : 'vw';
    var board = $('<div>')
      .css('width', 5*columns + app.lgside)
      .css('height', '20' + app.lgside)
      .attr('id', 'plateau');
    $(board).prependTo($('#main'));
  },

  //Création des cartes: jusqu'à nbCards on appelle la création d'une carte
  createCards(nbCards) {

    for (i = 0; i < nbCards; i++) {
      app.createCard(i);
    }
  },

  //Création d'une carte et de ses 2 faces avec la gestion de la position du sprite pour la partie image
  createCard(i) {

    //toutes les 2 cartes, on change la position du background, du coup on crée nos paires
    if (i%2 === 0 && i>0) {
      app.position += (100/17);
    }

    //création des cartes avec les classes nécessaires
    var card = $('<div>')
      .addClass('carte unmatched')
      .css('width', 4.75 + app.lgside)
      .css('height', 4.75 + app.lgside);

    //création du dos de la carte, on en profite pour mettre une classe selon le level qui affichera une image personnalisée
    var cache = $('<div>')
      .addClass('cache')
      .addClass(app.level.toLowerCase())
      .css('width', 4.75 + app.lgside)
      .css('height', 4.75 + app.lgside);

    //création de la face de la carte avec application du background-position précédemment calculé
    var image = $('<div>')
      .addClass('image')
      .css('width', 4.75 + app.lgside)
      .css('height', 4.75 + app.lgside)
      .css('background-position', '0% ' + app.position + '%')
      .data('position', app.position); //on stoke cette position dans un data pour un accès facilité au moment des comparaisons de paire

    $(card).append($(cache)).append($(image)); //on ajoute les deux faces à la carte "mère"
    app.cards.push(card); //on ajoute la carte "mère" avec ses deux faces à l'array cards
  },

  //Fonction de mélange aléatoire des cartes comprises dans app.cards
  shuffleCards(cards) {

    //ma fonction initiale mais après recherche sur internet pas vraiment aussi aléatoire qu'on le penserait
    // app.cards = cards.sort(function() { return 0.5 - Math.random() });

    //Du coup j'ai adapté un algo optimisé de mélange de type Fisher-Yates qui semble pertinent pour le besoin
    var totalCards = cards.length;
    var temp;
    var picked;
    // Tant qu'il reste des éléments à mélanger
    while (totalCards) {
      // On prend un élément au hasard
      picked = Math.floor(Math.random() * totalCards);
      // On décrémente totalCards
      totalCards--;
      // et on l'échange avec le "dernier" élément non mélangé.
      temp = cards[totalCards];
      cards[totalCards] = cards[picked];
      cards[picked] = temp;
    }
  },

  //Ajout des cartes au plateau
  addCardsToBoard(cards) {

    $(cards).each(function(index) {
      $(this).appendTo($('#plateau'));
    });
  },

  //Génération du tableau de HighScores et affichage ligne par ligne
  generateHighScores() {
    $('#score').empty(); //on vide le tableau
    for (i = 1; i <= localStorage.getItem('numGame'); i++) { // nb: numGame est le numéro de partie, il sert d'index pour les autres données
      var currentLevel = localStorage.getItem('level' + i); //grace à lui, on va chercher le level de difficulté de la victoire stockée
      var currentTimeScore = localStorage.getItem('timeScore' + i); //et le temps effectué
      var currentCombo = localStorage.getItem('combo' + i); //et la meilleure combo réalisée
      app.generateHighScore(i, currentLevel, currentTimeScore, currentCombo); //et on appelle la génération d'une ligne par victoire
    }
  },

  //Génération d'une ligne du tableau de HighScores
  generateHighScore(i, currentLevel, currentTimeScore, currentCombo) {
    var row = $('<tr>');
    var cellNumber = $('<td>').text(i);
    var cellLevel = $('<td>').text(currentLevel);
    var cellTime = $('<td>').text(currentTimeScore);
    var cellCombo = $('<td>').text(currentCombo);
    $(row).append($(cellNumber)).append($(cellLevel)).append($(cellTime)).append($(cellCombo)).appendTo($('#score'));
    $('#highScores').show(); //on affiche highScores ssi il y a au moins une ligne de créée pour ne pas avoir un tableau vide d'affiché (c'est moche)
  },

  //Gestion de la partie "chrono"
  timeManagement() {

    app.currentTimer += 100; //tous les 1/10eme de sec (cf setInterval chrono) on met à jour le temps de jeu d'autant
    $('#timer').attr('value', app.currentTimer); //on met à jour l'élément progress pour l'affichage

    //Si le temps de jeu arrive à 70% de la valeur max définie par le level on affiche un signal visuel au joueur
    if (app.currentTimer >= app.maxTimer*0.7) {
      $('#progressBox').addClass('explosive');
      $('#gameMessages').addClass('explosive').text('Hurry Up!!!');
    }

    //Si le temps de jeu arrive à la valeur max définie par le level :
    if (app.currentTimer === app.maxTimer) {
      $('#display').text('Mamma Mia...Game over!'); //on affiche un texte de défaite
      $('.carte').off('click', app.clickCard); //on empêche le clic sur les cartes
      clearInterval(app.chrono); //on efface notre setInterval chrono
      $('.unmatched').addClass('isFlipped'); //on retourne toutes les cartes
      setTimeout(function() { //et après 2 secondes de méditation mélancolique
        $('#startMenu').show(); //on réaffiche la page de Menu
        $('#display').removeClass('win').addClass('gameOver'); //puis on déclenche l'animation css (à faire après l'affichage de Menu)
      },2000);
    }
  },

  //Cascade d'évènements quand on clique sur le bouton cancel
  cancelGame(){
    $('.carte').off('click', app.clickCard); //on empêche le clic sur les cartes
    clearInterval(app.chrono); //on efface notre setInterval chrono
    $('#startMenu').show(); //on réaffiche la page de Menu
    $('#display').removeClass('win').removeClass('gameOver').text('Maybe next time...?!'); //on affiche un texte dans #display
  },

  //Gestion du clic sur les cartes
  clickCard(event) {
    $(this).addClass('focus').addClass('isFlipped'); //on détermine que la carte cliquée est "en jeu" et on la retourne (anim 3D)
    if(app.phase === false){ //si c'est la première carte d'une paire qui est retournée
      app.lastPosition = $(this).children('.image').data('position'); //on stocke la data position dans lastPosition
      app.phase = true; //on passe en phase "j'attends la 2eme carte retournée"
      $('.focus').off('click', app.clickCard); //on empêche un nouveau clic sur cette même première carte retournée
    }
    else{
      app.testPair(this); //on lance le test pour voir si une paire a été réalisée
    }
  },

  //On teste à chaque clic pour voir si une paire a été realisée
  testPair(card) {
    //Si la data stockée dans la carte est égale à celle de la dernière carte ET que c'est la 2 carte retournée
    if (($(card).children('.image').data('position') === app.lastPosition) && (app.phase === true)) {
      app.matchedPair(card);
    }

    //Autrement si la carte ne correspond pas mais qu'on est bien à la 2eme carte retournée
    else if (($(card).children('.image').data('position') !== app.lastPosition) && (app.phase === true)) {
      app.unmatchedPair(card);
    }
  },

  matchedPair(card){
      $('.focus').off('click', app.clickCard) //on désactive le click sur les 2 cartes de la paire
        .addClass('isGolden') //on ajoute la classe isGolden qui fait un effet visuel de confirmation autour de la paire
        .removeClass('unmatched') //on enlève la classe unmatched qui détermine les cartes non appairées
        .removeClass('focus'); //on enlève la classe focus qui détermine les 2 cartes "en jeu"
      app.score++; //on ajoute 1 au score
      app.phase = false; //on repasse à la phase initiale du jeu
      app.combo++;
      app.testCombo();
      app.testWin(); //on vérifie que la partie totale n'est pas remportée
  },

  unmatchedPair(card){
    $('.unmatched').off('click', app.clickCard); //on enlève immédiatement le click à toutes les cartes non appairées
    $('.focus').addClass('isWarning'); //on ajoute la classe isWarning pour une effet visuel autour des 2 cartes non appairées
    setTimeout(function() { //on lance un timeOut de 1 seconde pendant lequel le joueur ne peut pas cliquer mais voit les 2 cartes
      $('.unmatched').on('click', app.clickCard); //ensuite on remet les clicks sur les cartes non appairées
      $('.focus').removeClass('isFlipped') //on retourne face cachée les 2 cartes "en jeu"
        .removeClass('isWarning') //on leur enlève l'effet visuel isWarning
        .removeClass('focus'); //on leur enlève le statut "en jeu"
      app.phase = false; //on repasse à la phase initiale du jeu
      app.combo = 0; //on repasse le compteur de combo à zéro
      app.testCombo();
      $('#gameMessages').text('Try again!!'); //on vide la box
    }, 1000);
  },

  //Test pour déterminer si une combo a été réalisée et l'afficher dans gameMessages
  testCombo() {

    if (app.combo>app.bestCombo){
      app.bestCombo = app.combo;
    }
    //Si le compteur de combo est supérieur à 0
    if (app.combo>1){
      app.comboSwitch();
    }
    else if(app.combo ===1){
      $('#gameMessages').text('1 HIT COMBO !!!'); //on vide la box
    }
    //TODO : suivant les combos, on débloque des bonus (temps en plus, cartes retournées pendant 1 sec, etc)
  },

  comboSwitch(){
    //Si app.combo>2, ça déclenche un bonus choisi aléatoirement dans un array
    var comboList = [
      app.comboOneUp, //le temps revient en arrière de 10s
      app.comboStar, //le temps s'arrête pendant 8s
      app.comboPow //des cartes sont dévoilées pendant 2s
    ]
    comboList[Math.floor(Math.random() * comboList.length)]();
  },

  comboOneUp(){
    if(app.currentTimer>5000){
      app.currentTimer-= 5000;
    }
    else{
      app.currentTimer = 0;
    }
    $('#gameMessages').text(app.combo + ' HIT COMBO !!! 1-UP !!!');
  },

  comboStar(){
    var starredTimer = setInterval(function(){
      app.currentTimer -= 100;
    }, 100);
    setTimeout(function(){
      clearInterval(starredTimer);
    }, 4000);
    $('#gameMessages').text(app.combo + ' HIT COMBO !!! SUPER STAR !!!');
  },

  comboPow(){
    var totalUnmatched = $('.unmatched').length;
    var picked;
    var rand;
    // Tant qu'il reste des éléments à mélanger
    for(i=0;i<5;i++) {
      rand = Math.floor(Math.random() * totalUnmatched);
      picked = $('.unmatched')[rand];
      $(picked).addClass('powCards');
    }
    $('.powCards').addClass('isFlipped');
    $('.unmatched').off('click', app.clickCard);
    $('#gameMessages').text(app.combo + ' HIT COMBO !!! POW !!!')
    setTimeout(function(){
      $('.unmatched').removeClass('isFlipped').on('click', app.clickCard).removeClass('powCards');
    },2000)
;
  },

  //Test pour déterminer la victoire finale de la partie
  testWin() {
    //Si le score courant (compté par paire) est égal au nb total de cartes divisé par 2
    if (app.score === app.nbCards / 2) {
      $('#display').text('Here we go!!! Bravo!!!'); //on affiche un texte de victoire
      app.storeScore() //on gère le highscore avec la fonction idoine (j'avais envie de placer le mot idoine)
      clearInterval(app.chrono); //on arrête le chrono
      setTimeout(function(){
      $('#startMenu').show(); //on affiche la page du menu
      $('#display').removeClass('gameOver').addClass('win'); //on déclenche l'animation de victoire (tjs après l'affichage du menu)
      },2000);
    }
  },

  //Gestion du score une fois une victoire remportée
  storeScore() {
    var timeScore = Math.floor(app.currentTimer / 1000); //on convertit le temps réalisé en secondes
    var numGame = localStorage.getItem('numGame') > 0 ? parseInt(localStorage.getItem('numGame')) + 1 : 1; //on récupère et on incrémente numGame dans localStorage (1 si numGame n'existe pas)
    localStorage.setItem('numGame', numGame); //on rajoute les données de la victoire dans localStorage
    localStorage.setItem('level' + numGame, app.level);
    localStorage.setItem('timeScore' + numGame, timeScore);
    localStorage.setItem('combo' + numGame, app.bestCombo);
    app.generateHighScores(); //on génère le tableau de Highscores
  }



};

$(app.init);
