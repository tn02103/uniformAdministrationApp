import { SAFormHandler } from "./SAFormHandler";

describe('SAFormHandler', () => {
    it('should handle successful server action with return', async () => {
        const mockSuccess = jest.fn();
        const mockSetFormError = jest.fn();
        const mockFailure = jest.fn();

        const mockPromise = Promise.resolve({ data: 'success' });

        await SAFormHandler(mockPromise, mockSetFormError, mockSuccess, mockFailure);

        expect(mockSuccess).toHaveBeenCalledWith({ data: 'success' });
        expect(mockSetFormError).not.toHaveBeenCalled();
        expect(mockFailure).not.toHaveBeenCalled();
    });
    // successful server action with no return
    it('should handle successful server action with no return', async () => {
        const mockSuccess = jest.fn();
        const mockSetFormError = jest.fn();
        const mockFailure = jest.fn();

        const mockPromise = Promise.resolve();

        await SAFormHandler(mockPromise, mockSetFormError, mockSuccess, mockFailure);

        expect(mockSuccess).toHaveBeenCalledWith(undefined);
        expect(mockSetFormError).not.toHaveBeenCalled();
        expect(mockFailure).not.toHaveBeenCalled();
    });
    // formError with formElement and message
    it('should handle form error with formElement and message', async () => {
        const mockSetFormError = jest.fn();
        const mockSuccess = jest.fn();
        const mockFailure = jest.fn();
        const mockPromise = Promise.resolve({
            error: {
                formElement: 'testField',
                message: 'This is a test error message'
            }
        });
        await SAFormHandler(mockPromise, mockSetFormError, mockSuccess, mockFailure);
        expect(mockSetFormError).toHaveBeenCalledWith('testField', { message: 'This is a test error message' });
        expect(mockSuccess).not.toHaveBeenCalled();
        expect(mockFailure).not.toHaveBeenCalled();
    });
    // unhandled error with string message
    it('should handle unhandled error with string message', async () => {
        const { toast } = jest.requireMock('react-toastify');
        const mockSetFormError = jest.fn();
        const mockSuccess = jest.fn();
        const mockPromise = Promise.resolve({
            error: 'This is an unhandled error message'
        });
        await SAFormHandler(mockPromise, mockSetFormError, mockSuccess, 'This is an unhandled error message');
        expect(mockSetFormError).not.toHaveBeenCalled();
        expect(mockSuccess).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith('This is an unhandled error message');
    });
    it('should handle unhandled error with callback function', async () => {
        const mockSetFormError = jest.fn();
        const mockSuccess = jest.fn();
        const mockFailure = jest.fn();
        const mockPromise = Promise.resolve({
            error: 'This is an unhandled error message'
        });

        await SAFormHandler(mockPromise, mockSetFormError, mockSuccess, (error) => {
            mockFailure(error);
        });

        expect(mockSetFormError).not.toHaveBeenCalled();
        expect(mockSuccess).not.toHaveBeenCalled();
        expect(mockFailure).toHaveBeenCalledWith({ error: 'This is an unhandled error message' });
    });
    // uncaught thrown error
    it('should handle uncaught thrown error', async () => {
        const mockSetFormError = jest.fn();
        const mockSuccess = jest.fn();
        const mockFailure = jest.fn();

        const mockPromise = new Promise((_, reject) => {
            reject(new Error('This is an uncaught error'));
        });

        await SAFormHandler(mockPromise, mockSetFormError, mockSuccess, mockFailure);

        expect(mockSetFormError).not.toHaveBeenCalled();
        expect(mockSuccess).not.toHaveBeenCalled();
        expect(mockFailure).toHaveBeenCalledWith(new Error('This is an uncaught error'));
    });
    it('should handle uncaught thrown error with string message', async () => {
        const { toast } = jest.requireMock('react-toastify');
        const mockSetFormError = jest.fn();
        const mockSuccess = jest.fn();

        const mockPromise = new Promise((_, reject) => {
            reject('This is an uncaught error with string message');
        });

        await SAFormHandler(mockPromise, mockSetFormError, mockSuccess, 'Message to display in toast');

        expect(mockSetFormError).not.toHaveBeenCalled();
        expect(mockSuccess).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith('Message to display in toast');
    });
});