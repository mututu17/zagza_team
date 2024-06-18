// 슬라이드 애니메이션 
$("#slide-open").on("click", function(){  //버튼 클릭 시

    if($("#burgur").hasClass('on')){ //메뉴가 X 상태일때

      $("#burgur").removeClass('on'); //메뉴 원복
      $("#filter").removeClass('on');  //슬라이드 메뉴 원복
      $("#mobile-drawing-buttons").removeClass('on');
    
    } else{

      $("#burgur").addClass('on');    //메뉴 3줄
      $("#filter").addClass('on');     //슬라이드 메뉴 감춤
     $("#mobile-drawing-buttons").addClass('on');
    }
});