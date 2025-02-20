"use client";

const Title = ({ text }: { text: string }) => {
    return (
        <div className="d-flex justify-content-center w-100 px-3 py-2 fs-5 fw-bold">
            <span>{text}</span>
        </div>
    )
}

export default Title;