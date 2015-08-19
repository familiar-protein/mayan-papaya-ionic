var app = angular.module('Trivia', []);

//factory to get and hold question data
//also has methods for cleaning and augmenting question data
app.factory('Questions', ['$http', function($http) {
  var obj = {};

  // obj.getQuestions = function() { // retrieves questions from backend
  //   return $http.get('/api/trivia').success(function(data) {
  //     // using Angular $http service to query our questions route
  //     // success cb executes when request returns
  //     // route returns a list of questions
  //     obj.questions = data;
  //   });
  // };

  // obj.updateUser = function(user){
  //   return $http.put('/api/users', {
  //     username: user.username,
  //     score: user.score,
  //     correct: user.correct,
  //     correctStreak: user.correctStreak,
  //     answered: user.answered
  //   });
  // };

  return obj;
}]);


app.controller('TriviaController', ['$scope', '$http', 'Questions', '$interval', '$location', function($scope, $http, Questions, $interval, $location) {

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

  // $scope.updateUser = Questions.updateUser;
  // $scope.username = ProfileFactory.getUsername();

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
  $scope.navLoc = 0;
  $scope.questionCount = 0;
  $scope.nextLoc = function() {
    //TODO make more dynamic
    $scope.navLoc = 0;
    $scope.setCountdown();
    $scope.questionCount++;
    // if ($scope.questionCount === 10) {
    //   $scope.updateUser({
    //     username: $scope.username,
    //     score: $scope.score,
    //     correct: $scope.correct,
    //     correctStreak: $scope.correctStreak,
    //     answered: $scope.answered

    //   });
    //   $location.path("/trivia/endgame"); // render endgame view
    // }
  };

  //for getting trivia questions from the jService API
  $scope.getQuestions = function() {
    Questions.getQuestions()
      .success(function(data) {
        $scope.questions = data;
      });
  };
  //$scope.getQuestions();

  //for handling user answers to trivia
 $scope.checkAnswer = function(question, answer) {
    $scope.answered++;
    var id = question.id;
    var value = question.value;
    var userAns = question.userAnswer;
    if(answer === question.correct) {
      $scope.correct++;
      $scope.currentStreak++;
      $scope.score += Math.floor(Math.sqrt(+question.level) * 50 + $scope.counter);
    } else {
      $scope.currentStreak = 0;
    }
    if($scope.currentStreak > $scope.correctStreak){
      $scope.correctStreak = $scope.currentStreak;
    }
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
  //cancel timer if user navigates away from questions
  $scope.$on('$destroy', function() {
    $interval.cancel($scope.gameTimer);
  });
  $scope.setCountdown();

}]);

