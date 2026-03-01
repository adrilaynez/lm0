import { useCallback,useMemo, useState } from "react";

export type ActivationFn = "linear" | "relu" | "sigmoid" | "tanh";

const ACTIVATION_MAP: Record<ActivationFn, (x: number) => number> = {
    linear: (x) => x,
    relu: (x) => Math.max(0, x),
    sigmoid: (x) => 1 / (1 + Math.exp(-x)),
    tanh: (x) => Math.tanh(x),
};

const DERIVATIVE_MAP: Record<ActivationFn, (z: number, fz: number) => number> = {
    linear: () => 1,
    relu: (z) => (z > 0 ? 1 : 0),
    sigmoid: (_z, fz) => fz * (1 - fz),
    tanh: (_z, fz) => 1 - fz * fz,
};

export const ACTIVATION_LABELS: Record<ActivationFn, string> = {
    linear: "Linear",
    relu: "ReLU",
    sigmoid: "Sigmoid",
    tanh: "Tanh",
};

export const ACTIVATION_SHORT: Record<ActivationFn, string> = {
    linear: "f",
    relu: "ReLU",
    sigmoid: "σ",
    tanh: "tanh",
};

export interface TrainingRecord {
    step: number;
    w1: number;
    w2: number;
    b: number;
    prediction: number;
    loss: number;
}

export interface Gradients {
    dLdpred: number;
    dpredDz: number;
    dLdz: number;
    dLdw1: number;
    dLdw2: number;
    dLdb: number;
}

export function useNeuralNet() {
    const [x1, setX1] = useState(1.0);
    const [x2, setX2] = useState(0.5);
    const [w1, setW1] = useState(0.7);
    const [w2, setW2] = useState(-0.3);
    const [b, setB] = useState(0.1);
    const [activation, setActivation] = useState<ActivationFn>("sigmoid");
    const [target, setTarget] = useState(0.8);
    const [learningRate, setLearningRate] = useState(0.5);
    const [history, setHistory] = useState<TrainingRecord[]>([]);

    const fn = ACTIVATION_MAP[activation];
    const fnDeriv = DERIVATIVE_MAP[activation];

    const z = useMemo(() => w1 * x1 + w2 * x2 + b, [w1, x1, w2, x2, b]);
    const prediction = useMemo(() => fn(z), [fn, z]);
    const loss = useMemo(() => (prediction - target) ** 2, [prediction, target]);

    const gradients: Gradients = useMemo(() => {
        const dLdpred = 2 * (prediction - target);
        const dpredDz = fnDeriv(z, prediction);
        const dLdz = dLdpred * dpredDz;
        return { dLdpred, dpredDz, dLdz, dLdw1: dLdz * x1, dLdw2: dLdz * x2, dLdb: dLdz };
    }, [prediction, target, fnDeriv, z, x1, x2]);

    const trainStep = useCallback(() => {
        const nw1 = w1 - learningRate * gradients.dLdw1;
        const nw2 = w2 - learningRate * gradients.dLdw2;
        const nb = b - learningRate * gradients.dLdb;
        setW1(nw1);
        setW2(nw2);
        setB(nb);
        setHistory(h => [...h, { step: h.length + 1, w1: nw1, w2: nw2, b: nb, prediction, loss }]);
    }, [w1, w2, b, learningRate, gradients, prediction, loss]);

    const autoTrain = useCallback((n: number) => {
        let cw1 = w1, cw2 = w2, cb = b;
        const records: TrainingRecord[] = [];
        let nextStep = history.length + 1;
        for (let i = 0; i < n; i++) {
            const cz = cw1 * x1 + cw2 * x2 + cb;
            const cpred = fn(cz);
            const closs = (cpred - target) ** 2;
            const dLdp = 2 * (cpred - target);
            const dpDz = fnDeriv(cz, cpred);
            const dLdz = dLdp * dpDz;
            cw1 -= learningRate * dLdz * x1;
            cw2 -= learningRate * dLdz * x2;
            cb -= learningRate * dLdz;
            records.push({ step: nextStep++, w1: cw1, w2: cw2, b: cb, prediction: cpred, loss: closs });
        }
        setW1(cw1);
        setW2(cw2);
        setB(cb);
        setHistory(h => [...h, ...records]);
    }, [w1, w2, b, x1, x2, fn, fnDeriv, target, learningRate, history.length]);

    const reset = useCallback(() => {
        setW1(0.7); setW2(-0.3); setB(0.1);
        setHistory([]);
    }, []);

    const randomize = useCallback(() => {
        setW1(+((Math.random() * 4 - 2).toFixed(2)));
        setW2(+((Math.random() * 4 - 2).toFixed(2)));
        setB(+((Math.random() * 4 - 2).toFixed(2)));
        setHistory([]);
    }, []);

    return {
        x1, x2, w1, w2, b, activation, target, learningRate,
        setX1, setX2, setW1, setW2, setB, setActivation, setTarget, setLearningRate,
        z, prediction, loss, gradients,
        history, trainStep, autoTrain, reset, randomize,
        activationFn: fn,
    };
}
