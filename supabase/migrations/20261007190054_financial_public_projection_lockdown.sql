begin;
drop policy "La raza puede ver los eventos" on public."Event";
drop policy "La raza puede ver los pagos" on public."Payment";
revoke select on public."Event", public."Payment" from anon;
commit;
