/*function addToCart(proId){
            $.ajax({
                url:'/add-to-cart/'+proId,
                method:'get',
                success:(response)=>{
                    if(response.status){
                        let count=$('#cart-count').html()
                        count=parseInt(count)+1
                        $("#cart-count").html(count)

                    }
                    alert(response)
                }
            })
        } */
function addToCart(proId) {
    $.ajax({
        url: '/add-to-cart/' + proId + '?t=' + new Date().getTime(), // ⛔ cache buster
        method: 'get',
        success: (response) => {
            console.log('Add to Cart response:', response); // ✅ debug
            if (response.status) {
                let count = $('#cart-count').html();
                count = parseInt(count) + 1;
                $('#cart-count').html(count);
            } else if (response.login) {
                window.location.href = '/login'; // ⛔ redirect to login if needed
            }
        }
    });
}
// Add these functions to your script.js file

function changeQuantity(cartId, proId, count) {
    let quantity = parseInt(document.getElementById(cartId).innerHTML);
    count = parseInt(count);
    
    $.ajax({
        url: '/change-product-quantity',
        data: {
            cart: cartId,
            product: proId,
            count: count,
            quantity: quantity
        },
        method: 'post',
        success: (response) => {
            if (response.removeProduct) {
                alert("Product removed from cart");
                location.reload();
            } else {
                document.getElementById(cartId).innerHTML = quantity + count;
                document.getElementById('total').innerHTML = "₹ " + response.total;
            }
        }
    });
}

// Alternative simpler approach - separate increment/decrement functions
function incrementQuantity(proId) {
    $.ajax({
        url: '/increment-quantity/' + proId,
        method: 'post',
        success: (response) => {
            if (response.status) {
                location.reload(); // Reload to show updated quantity and total
            }
        },
        error: (err) => {
            console.error('Error incrementing quantity:', err);
        }
    });
}

function decrementQuantity(proId) {
    $.ajax({
        url: '/decrement-quantity/' + proId,
        method: 'post',
        success: (response) => {
            if (response.status) {
                if (response.removeProduct) {
                    alert("Product removed from cart");
                }
                location.reload(); // Reload to show updated quantity and total
            }
        },
        error: (err) => {
            console.error('Error decrementing quantity:', err);
        }
    });
}
