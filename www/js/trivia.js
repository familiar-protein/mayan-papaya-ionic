var app = angular.module('Trivia', ['Profile']);
var url = 'http://localhost:3000';

//factory to get and hold question data
//also has methods for cleaning and augmenting question data
app.factory('Questions', ['$http', function($http) {
  var obj = {};

  obj.getQuestions = function() { // retrieves questions from backend
    return $http.get(url + '/api/trivia').success(function(data) {
      // using Angular $http service to query our questions route
      // success cb executes when request returns
      // route returns a list of questions
      obj.questions = data;
    });
  };

  obj.updateUser = function(user){
    return $http.put('http://localhost:3000/api/users', {
      username: user.username,
      score: user.score,
      correct: user.correct,
      correctStreak: user.correctStreak,
      answered: user.answered
    });
  };

  return obj;
}]);

app.factory('SocketFactory', function(){
  var socket;
  return {
    setupSocket : function(code) {
      socket = io('http://localhost:3000/' + code);
    },
    getSocket: function() {
      return socket;
    }
  }
})
app.controller('TriviaController', ['$scope', '$http', 'Questions', '$interval', '$location', 'ProfileFactory', 'SocketFactory', function($scope, $http, Questions, $interval, $location, ProfileFactory, SocketFactory) {

  //sample trivia api response for chai test
  $scope.questions = {
    "0": {
      "question":"In what children's game are participants chased by someone designated \"It\"?",
      "content":["Tag","Simon Says","Charades","Hopscotch"],
      "correct":0,
      "level":1,
      "id":0
    }
  };

  $scope.updateUser = Questions.updateUser;
  $scope.username = ProfileFactory.getUsername();

  // initialize game data
  $scope.gameDataInit = function() {
    $scope.answered = 0;
    $scope.correct = 0;
    $scope.correctStreak = 0;
    $scope.currentStreak = 0;
    $scope.score = 0;
  };

  $scope.gameDataInit();

  //for question navigation
  // $scope.navLoc = Math.floor(Math.random() * 150);
  $scope.navLoc = Math.floor(Math.random() * 150);
  $scope.questionCount = 0;
  $scope.nextLoc = function() {
    //TODO make more dynamic
    $scope.navLoc = Math.floor(Math.random() * 150);
    $scope.setCountdown();
    $scope.questionCount++;
    if ($scope.questionCount === 10) {
      $scope.updateUser({
        username: $scope.username,
        score: $scope.score,
        correct: $scope.correct,
        correctStreak: $scope.correctStreak,
        answered: $scope.answered
      });
      $scope.questionCount = 0;
      $location.path("app/trivia"); // render endgame view
    }
  };

  //for getting trivia questions from the jService API
  $scope.getQuestions = function() {
    Questions.getQuestions()
      .success(function(data) {
        $scope.questions = data;
      });
  };
  $scope.getQuestions();

  //for handling user answers to trivia
 $scope.checkAnswer = function(question, answer) {
    $scope.socket = SocketFactory.getSocket();
    $scope.answered++;
    var id = question.id;
    var value = question.value;
    var userAns = question.userAnswer;

    if(answer === question.answer) {
      $scope.correct++;
      $scope.currentStreak++;
      $scope.score += Math.floor(Math.sqrt(+question.level) * 50 + $scope.counter);
    } else {
      $scope.currentStreak = 0;
    }
    if($scope.currentStreak > $scope.correctStreak){
      $scope.correctStreak = $scope.currentStreak;
    }
    $scope.socket.emit('finishedq', {username: $scope.username, score: $scope.score});
    $scope.nextLoc();
//       return $http.post('/api/trivia', {
//        id: id,
//        value: value,
//        userAns: userAns
//      }).then(function (res) {
//        var q = res.data;
//        if(q.correct){
//          $scope.correct++;
//          $scope.currentStreak++;
//          $scope.score += value;
//        }else{
//          $scope.currentStreak = 0;
//        }
//        if($scope.currentStreak > $scope.correctStreak){
//          $scope.correctStreak = $scope.currentStreak;
//        }
//        $scope.nextLoc();
//      });
  };



  //Timer uses timeout function
  //cancels a task associated with the promise
  $scope.setCountdown = function() {
    //resets the timer
    if(angular.isDefined($scope.gameTimer)) {
      $interval.cancel($scope.gameTimer);
      $scope.gameTimer = undefined;
    }
    //initialize timer number
    $scope.counter = 15;
    //countdown
    $scope.gameTimer = $interval(function() {
      $scope.counter--;
      if($scope.counter === 0) {
        $scope.nextLoc();
        $scope.setCountdown();
      }
    }, 1000);
  };
  $scope.setCountdown();

  //cancel timer if user navigates away from questions
  $scope.$on('$destroy', function() {
    $interval.cancel($scope.gameTimer);
  });

  /**
   * Sockets below
   */
  $scope.setupSocket = function() {
    SocketFactory.setupSocket($scope.code);
    $scope.socket = SocketFactory.getSocket();
    $scope.socket.emit('newuser', $scope.username);

    $scope.socket.on('userlist', function(userList) {
      console.log('Socket : On : userlist: ' + userList);
      $scope.userScores = userList;
      $scope.$apply();
    });

    $scope.socket.on('startgame', function(questions) {
      console.log("Socket: startgame");
      console.log(questions);

      $scope.questionNums = questions;
      $scope.startGame();
    });

    $scope.socket.on('scoreupdate', function(data) {
      console.log("Socket: scoreupdate");
      $scope.userScores[data.username] = data.score;
      $scope.$apply();
    });

    $scope.socket.on('nextq', function(data) {
      console.log("Socket: nextq");
      $scope.userScores = data;
      // ??? $scope.$apply() ?

      $scope.nextLoc();
    });

    $scope.socket.on('endgame', function(data) {
      console.log("Socket: endgame");
      $scope.userScores = data;
      // ??? $scope.$apply() ?

      $scope.endGame();
    });
  };

  // Request a new game from the server;
  // on success, we receive a code for our game room / socket namespace
  $scope.newGame = function() {

    return $http.get('http://localhost:3000/api/game').success(function(data) {

      // TODO: handle intial game setup ...
      // - set up socket connection?
      // - update the view?
      // * set some state info that indicates that this user
      // initiated the game -> gets a start button to start gameplay
      $scope.code = data.code;
      $scope.initiatedGame = true;
      $scope.validGameRequest = true;
      console.log("TriviaController: newGame " + $scope.code + " initiatedGame is " + $scope.initiatedGame);

      $scope.setupSocket();

    });
  };

  $scope.joinGame = function() {
    // $scope.code should be set from the form model
    $scope.code = document.getElementById('formCode').value;
    console.log($scope.code);

    return $http.put('http://localhost:3000/api/game/join', {code: $scope.code})
    .success(function(data) {
      console.log("TriviaController: joinGame " + $scope.code);
      $scope.initiatedGame = false;
      $scope.validGameRequest = true;

      $scope.setupSocket();
    }).error(function(data) {
      // TODO: handle the error and prevent the user from being redirected
      // to the start game view.
      console.log("TriviaController: joinGame error with code " + $scope.code);
      $scope.invalidGameRequest = true;
    });
  };

  $scope.initiateGame = function() {
    $scope.socket.emit('initiategame');
  };

  $scope.startGame = function() {
    // start timers ...

    // if ($scope.initiatedGame) {
    //   $scope.socket.emit('startgame');
    // }
    // initialize the question state: use the first question number
    $scope.questionCount = 0;
    $scope.navLoc = $scope.questionNums[$scope.questionCount];
    console.log("TriviaController: startGame navLoc " + $scope.navLoc);

    $scope.gameDataInit();
    $scope.setCountdown();

    $scope.$apply(function() {
      $location.path("/app/trivia/play"); // render play view
      console.log("$location.path: " + $location.path());
    });
  };

  $scope.highScore = function() {
    var currHighest;

    console.log("Calculating highScore");

    for (var key in $scope.userScores) {
      if (currHighest === undefined) {
        currHighest = [key, $scope.userScores[key]];
      } else if ($scope.userScores[key] > currHighest[1]) {
        currHighest = [key, $scope.userScores[key]];
      }
    }

    $scope.winner = currHighest;
  };

  $scope.endGame = function() {
    // TODO: this part probably needs to change to wait
    // for server to indicate end game
    $scope.updateUser({
      username: $scope.username,
      score: $scope.score,
      correct: $scope.correct,
      correctStreak: $scope.correctStreak,
      answered: $scope.answered
    });

    // calculate who won for display in the endgame view
    $scope.highScore();
    $location.path("/trivia/endgame"); // render endgame view
  };


}]);

