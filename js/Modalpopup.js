document.addEventListener("DOMContentLoaded", function () {
    const openModalButton = document.getElementById("manual_btn");
    const closeModalButton = document.getElementById("closeModalButton");
    const modal = document.getElementById("myModal");

    openModalButton.addEventListener("click", function () {
        modal.style.display = "block";
    });

    closeModalButton.addEventListener("click", function () {
        modal.style.display = "none";
    });
});