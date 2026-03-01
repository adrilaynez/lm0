import 'katex/dist/katex.min.css';

import { BlockMath,InlineMath } from 'react-katex';

export const MathBlock = ({ formula }: { formula: string }) => {
    return (
        <div className="my-6 overflow-x-auto py-2 text-center text-lg text-foreground/90">
            <BlockMath math={formula} />
        </div>
    );
};

export const MathInline = ({ formula }: { formula: string }) => {
    return <InlineMath math={formula} />;
};
