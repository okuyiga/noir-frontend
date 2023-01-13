import { expect } from "chai";
import { ethers } from "hardhat";
import path from "path";

import { compile, acir_to_bytes } from '@noir-lang/noir_wasm';
import { setup_generic_prover_and_verifier, create_proof, verify_proof } from '@noir-lang/barretenberg/dest/client_proofs';
import { getCircuitSize } from '@noir-lang/barretenberg/dest/client_proofs/generic_proof/standard_example_prover';
import { serialise_acir_to_barrtenberg_circuit } from '@noir-lang/aztec_backend';
import { BarretenbergWasm } from '@noir-lang/barretenberg/dest/wasm';
import { writeFileSync } from "fs";


describe("TurboVerifier", function () {
    this.timeout(0);
    let verifierContract: any;
    let acir: any;
    let abi: any;
    let prover: any;
    let verifier: any;

    before(async function() {

        const Verifier = await ethers.getContractFactory("TurboVerifier");
        verifierContract = await Verifier.deploy();
        console.log(verifierContract);
        await verifierContract.deployed();

        const compiled_program = compile(path.resolve(__dirname, "../circuits/src/main.nr"));

        acir = compiled_program.circuit;
        abi = compiled_program.abi;

        // console.log("abi", abi);

        const serialised_circuit = serialise_acir_to_barrtenberg_circuit(acir);
        const barretenberg = await BarretenbergWasm.new();
        const circSize = await getCircuitSize(barretenberg, serialised_circuit);
        console.log("circSize", circSize);
        
        [prover, verifier] = await setup_generic_prover_and_verifier(acir);

        // console.log(serialised_circuit);
        writeFileSync(path.resolve(__dirname, "../circuits/src/main.buf"), Buffer.from(serialised_circuit));

        // console.log(acir_to_bytes(acir));
        writeFileSync(path.resolve(__dirname, "../circuits/src/acir.buf"), Buffer.from(acir_to_bytes(acir)));

    });

    it("Should verify proof in nargo", async function () {
        abi.x = 189;
        // abi.y = 35;
        abi.result = [104, 50, 87, 32, 170, 189, 124, 130, 243, 15, 85, 75, 49, 61, 5, 112, 201, 90, 204, 187, 125, 196, 181, 170, 225, 18, 4, 192, 143, 254, 115, 43];

        const proof = await create_proof(prover, acir, abi);
        const verified = await verify_proof(verifier, proof);

        expect(verified).eq(true);
    });

    it("Should reject false proof", async function () {
        abi.x = 199;
        // abi.y = 35;
        abi.result = [104, 50, 87, 32, 170, 189, 124, 130, 243, 15, 85, 75, 49, 61, 5, 112, 201, 90, 204, 187, 125, 196, 181, 170, 225, 18, 4, 192, 143, 254, 115, 43];

        const proof = await create_proof(prover, acir, abi);
        const verified = await verify_proof(verifier, proof);

        expect(verified).eq(false);
    });

    it("Should verify proof in smart contract", async function () {
        abi.x = 189;
        // abi.y = 35;
        abi.result = [104, 50, 87, 32, 170, 189, 124, 130, 243, 15, 85, 75, 49, 61, 5, 112, 201, 90, 204, 187, 125, 196, 181, 170, 225, 18, 4, 192, 143, 254, 115, 43];

        const proof = await create_proof(prover, acir, abi);
        const proofArr = [...proof];
        const sc_verified = await verifierContract.verify(proof);

        expect(sc_verified).eq(true);
    });

    it("Should reject false proof in smart contract", async function () {
        abi.x = 199;
        // abi.y = 35;
        abi.result = [104, 50, 87, 32, 170, 189, 124, 130, 243, 15, 85, 75, 49, 61, 5, 112, 201, 90, 204, 187, 125, 196, 181, 170, 225, 18, 4, 192, 143, 254, 115, 43];

        const proof = await create_proof(prover, acir, abi);

        await expect(verifierContract.verify(proof)).to.be.revertedWith("Proof failed");
    });
});
