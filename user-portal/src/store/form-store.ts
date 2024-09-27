import {create} from 'zustand';


export const userFormStore = create((set) => ({
    open: false,
    data: {
        name: '',
        email: '',
        company: '',
        phone: '',
        message: '',
    },
    setOpen: (open: boolean) => set({open}),
    setData: (data: any) => set({data}),
}));

export const fileFormStore = create((set) => ({
    open: false,
    setOpen: (open: boolean) => set({open}),
    file: null,
}));