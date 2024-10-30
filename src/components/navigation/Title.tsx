import React from 'react';

const Title = ({ text }: { text: string }) => {
    return (
        <div className='d-flex align-items-center justify-content-center p-3' style={{width: 'fit-content', height: 60 }}>
            <h3 className='m-0'>{text}</h3>
        </div>
    );
};

export default Title;