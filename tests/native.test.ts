import {
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    sendAndConfirmTransaction,
    SystemProgram,
} from '@solana/web3.js';
import {
    createMint,
    createAccount,
    mintTo,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

//the test do not work

const PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID'); 
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

describe('Minting Test', () => {
    let payer: Keypair;
    let mintAuthority: Keypair;
    let freezeAuthority: Keypair;
    let mint: PublicKey;
    let receiver: PublicKey;

    before(async () => {
        payer = Keypair.generate();

        const airdropSignature = await connection.requestAirdrop(payer.publicKey, 1e9);
        await connection.confirmTransaction(airdropSignature);

        mintAuthority = Keypair.generate();
        freezeAuthority = Keypair.generate();
        
        mint = await createMint(
            connection,
            payer,
            mintAuthority.publicKey,
            freezeAuthority.publicKey,
            6
        );

        receiver = await createAccount(connection, payer, mint, payer.publicKey);
    });

    it('should initialize the mint', async () => {
        const initTransaction = new Transaction().add({
            keys: [
                { pubkey: mint, isSigner: false, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                { pubkey: payer.publicKey, isSigner: true, isWritable: false },
                { pubkey: mintAuthority.publicKey, isSigner: true, isWritable: false },
                { pubkey: freezeAuthority.publicKey, isSigner: false, isWritable: false },
            ],
            programId: PROGRAM_ID,
            data: Buffer.from([0]),
        });

        const initSignature = await sendAndConfirmTransaction(connection, initTransaction, [payer]);

        assert(initSignature, 'Mint initialization failed!');
    });

    it('should mint tokens to the receiver', async () => {
        const mintAmount = 1000; 
        const instructionData = Buffer.concat([
            Buffer.from([1]),
            Buffer.from(BigInt(mintAmount).toString()), 
        ]);

        const mintTransaction = new Transaction().add({
            keys: [
                { pubkey: mint, isSigner: false, isWritable: true },
                { pubkey: receiver, isSigner: false, isWritable: true },
                { pubkey: mintAuthority.publicKey, isSigner: true, isWritable: false },
            ],
            programId: PROGRAM_ID,
            data: instructionData,
        });

        const mintSignature = await sendAndConfirmTransaction(connection, mintTransaction, [payer]);

        assert(mintSignature, 'Minting tokens failed!');
    });
});