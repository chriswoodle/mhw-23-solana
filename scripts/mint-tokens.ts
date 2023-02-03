import { Keypair, PublicKey } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import {
    shotMintKeypair,
    ammoMintKeypair,
    connection,
    randomPayer,
    getAmmoMintAuthorityPDA,
} from "./config";


const createMints = async () => {
    const shotMintAddress = await createMintAcct(
        shotMintKeypair,
        shotMintKeypair.publicKey
    )

    const [ammoPDA, _] = await getAmmoMintAuthorityPDA();
    const stakeMintAddress = await createMintAcct(
        ammoMintKeypair,
        ammoPDA)

    console.log(`🔫 shot Mint Address: ${shotMintAddress}`);
    console.log(`🚅 ammo Mint Address: ${stakeMintAddress}`);
}



const createMintAcct = async (keypairToAssign: Keypair, authorityToAssign: PublicKey): Promise<PublicKey> => {
    return await createMint(
        connection,
        await randomPayer(),
        authorityToAssign, // mint authority
        null, // freeze authority (you can use `null` to disable it. when you disable it, you can't turn it on again)
        8, // decimals
        keypairToAssign // address of the mint
    );
}


export {
    createMints
}