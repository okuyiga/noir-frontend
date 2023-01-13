use dep::std;

// fn main(x: [u8; 5], result: [u8; 32]) {
// fn main(x: Field, y: pub Field) {
//     constrain x != y;
//     let mut message: [u8; 5] = [0, 101, 108, 108, 111];
//     message[0] = x as u8;
//     let mut digest = std::hash::sha256(message);
//     constrain digest == [44, 242, 77, 186, 95, 176, 163, 14, 38, 232, 59, 42, 197, 185, 226, 158, 27, 22, 30, 92, 31, 167, 66, 94, 115, 4, 51, 98, 147, 139, 152, 36];
// }


fn main(x: Field, result: pub [u8; 32]) {
    // We use the `as` keyword here to denote the fact that we want to take just the first byte from the x Field
    // The padding is taken care of by the program
    // let mut digest = std::hash::sha256([x as u8]);
    // constrain digest == result;

	let digest = std::sha256::digest([x as u8]);
    constrain digest == result;
}
