let aktivFeladat = null;

function betoltes(){

    if (aktivFeladat === 2) {
        document.getElementById("torzs").innerHTML = "";
        aktivFeladat = null;
        return;
    }
    aktivFeladat = 2;

    document.getElementById("torzs").innerHTML=`<p>alma</p>`
}